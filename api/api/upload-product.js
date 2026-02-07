export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const shop = process.env.SHOPIFY_STORE_DOMAIN;
    const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
    const version = process.env.SHOPIFY_API_VERSION || "2026-01";

    const {
      title,
      price,
      sizes,
      fabric,
      image_front,
      image_back,
    } = req.body;

    if (!title) {
      return res.status(400).json({ ok: false, error: "Missing title" });
    }

    const description = `
      <p><strong>Tecido:</strong> ${fabric || "Não informado"}</p>
      <p><strong>Tamanhos:</strong> ${sizes || "Não informado"}</p>
    `;

    const url = `https://${shop}/admin/api/${version}/graphql.json`;

    const query = `
      mutation productCreate($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        title,
        descriptionHtml: description,
        status: "DRAFT",
      },
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await resp.json();

    return res.status(200).json({
      ok: true,
      product: data.data.productCreate.product,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: String(err),
    });
  }
}
