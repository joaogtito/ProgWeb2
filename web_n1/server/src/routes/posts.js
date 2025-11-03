import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import { z } from "zod";

const router = Router();

// Middleware para autenticação via cookie JWT
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

// 🔹 Validação de conteúdo
const postSchema = z.object({
  content: z
    .string()
    .min(1, "Post vazio")
    .max(256, "Post muito longo (máx. 256 caracteres)"),
});

// 🔹 GET /api/posts
router.get("/", auth, async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: { author: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(posts);
  } catch (err) {
    console.error("Erro ao listar posts:", err);
    res.status(500).json({ error: "Erro ao listar posts" });
  }
});

// 🔹 POST /api/posts
router.post("/", auth, async (req, res) => {
  try {
    const { content } = postSchema.parse(req.body);

    const post = await prisma.post.create({
      data: {
        content,
        authorId: req.userId,
      },
      include: { author: { select: { name: true, email: true } } },
    });

    res.status(201).json(post);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    console.error("Erro ao criar post:", err);
    res.status(500).json({ error: "Erro ao criar post" });
  }
});

// 🔹 DELETE /api/posts/:id
router.delete("/:id", auth, async (req, res) => {
  const postId = Number(req.params.id);
  if (isNaN(postId)) return res.status(400).json({ error: "ID inválido" });

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) return res.status(404).json({ error: "Post não encontrado" });
    if (post.authorId !== req.userId)
      return res.status(403).json({ error: "Você não pode excluir este post" });

    await prisma.post.delete({ where: { id: postId } });
    return res.status(200).json({ message: "Post excluído com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir post:", err);
    return res.status(500).json({ error: "Erro ao excluir post" });
  }
});

export default router;
