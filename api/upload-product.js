export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok:false, error:"Method not allowed" });
  }

  try {
    const {
      title,
      price,
      sizes,
      fabric,
      image_front,
      image_back
    } = req.body || {};

    if (!title) {
      return res.status(400).json({ ok:false, error:"Missing title" });
    }

    const shop  = process.env.SHOPIFY_STORE;
    const token = process.env.SHOPIFY_ADMIN_TOKEN;

    const description = `
<p><b>Tecido:</b> ${fabric || "Não informado"}</p>
<p><b>Tamanhos:</b> ${sizes || "Não informado"}</p>
<p>Produto criado automaticamente pela SobeAI.</p>
`;

    // 🔹 Cria produto rascunho
    const create = await fetch(
      `https://${shop}/admin/api/2024-01/products.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          product: {
            title,
            body_html: description,
            status: "draft",
            variants: [
              {
                price: price || "199.90"
              }
            ]
          }
        })
      }
    );

    const productData = await create.json();

    if (!productData.product) {
      return res.status(500).json({
        ok:false,
        error:"Product creation failed",
        shopify: productData
      });
    }

    const productId = productData.product.id;

    // 🔹 Função para subir imagem
    async function uploadImage(base64) {
      if (!base64) return;

      await fetch(
        `https://${shop}/admin/api/2024-01/products/${productId}/images.json`,
        {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": token,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            image: {
              attachment: base64.split(",")[1]
            }
          })
        }
      );
    }

    // 🔹 Upload das duas imagens
    await uploadImage(image_front);
    await uploadImage(image_back);

    return res.status(200).json({
      ok:true,
      product:{
        id: productId,
        title,
        status:"draft"
      }
    });

  } catch (e) {
    return res.status(500).json({
      ok:false,
      error:String(e)
    });
  }
}
