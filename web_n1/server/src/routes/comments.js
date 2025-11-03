import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import { z } from "zod";

const router = Router();

// Middleware de autenticação
function auth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Não autenticado" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}

// Validação do comentário
const commentSchema = z.object({
  postId: z.number(),
  content: z
    .string()
    .min(1, "Comentário vazio")
    .max(256, "Comentário muito longo"),
});


// 🔹 Listar comentários de um post (com paginação)
router.get("/:postId", async (req, res) => {
  const postId = parseInt(req.params.postId);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { postId },
        include: { author: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
      }),
      prisma.comment.count({ where: { postId } }),
    ]);

    const totalPages = Math.ceil(total / limit);
    res.json({ comments, totalPages });
  } catch (err) {
    console.error("Erro ao listar comentários:", err);
    res.status(500).json({ error: "Erro ao listar comentários" });
  }
});


// 🔹 Criar comentário
router.post("/", auth, async (req, res) => {
  try {
    const data = commentSchema.parse({
      postId: Number(req.body.postId),
      content: req.body.content,
    });

    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        postId: data.postId,
        authorId: req.userId,
      },
      include: { author: { select: { name: true, email: true } } },
    });

    res.status(201).json(comment);
  } catch (err) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ error: err.errors[0].message });

    console.error("Erro ao criar comentário:", err);
    res.status(500).json({ error: "Erro ao criar comentário" });
  }
});


// 🔹 Excluir comentário (somente o autor)
router.delete("/:id", auth, async (req, res) => {
  const commentId = Number(req.params.id);
  if (isNaN(commentId))
    return res.status(400).json({ error: "ID inválido" });

  try {
    console.log("🗑️ Tentando excluir comentário:", commentId, "User:", req.userId);

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment)
      return res.status(404).json({ error: "Comentário não encontrado" });

    if (comment.authorId !== req.userId)
      return res
        .status(403)
        .json({ error: "Você não pode excluir este comentário" });

    await prisma.comment.delete({ where: { id: commentId } });

    return res.status(200).json({ message: "Comentário excluído com sucesso" });
  } catch (err) {
    console.error("❌ Erro ao excluir comentário:", err);
    res.status(500).json({ error: err.message || "Erro ao excluir comentário" });
  }
});


export default router;
