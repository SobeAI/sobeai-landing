export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {

    const body = req.body || {};

    console.log("BODY RECEBIDO:", body);

    return res.status(200).json({
      ok: true,
      message: "Formulário recebido com sucesso",
      data: body
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
}
