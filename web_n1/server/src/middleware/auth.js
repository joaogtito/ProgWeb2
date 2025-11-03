import jwt from "jsonwebtoken";

// middleware de autenticação
function auth(req, res, next) {
  if (!req.session?.user) return res.status(401).json({ error: "Não autorizado" });
  req.user = req.session.user;
  next();
}

// obter usuário logado
app.get("/auth/me", auth, (req, res) => res.json(req.user));

// posts
app.get("/posts", auth, async (req, res) => {
  const posts = await prisma.post.findMany({
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(posts);
});

app.post("/posts", auth, async (req, res) => {
  const { content } = req.body;
  const post = await prisma.post.create({
    data: {
      content,
      authorId: req.user.id,
    },
    include: { author: { select: { name: true } } },
  });
  res.json(post);
});
