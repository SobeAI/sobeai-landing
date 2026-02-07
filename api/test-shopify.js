export default async function handler(req, res) {
  try {
    const shop = process.env.SHOPIFY_STORE_DOMAIN;
    const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
    const version = process.env.SHOPIFY_API_VERSION || "2026-01";

    if (!shop || !token) {
      return res.status(500).json({
        ok: false,
        error: "Missing env vars: SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN",
      });
    }

    const url = `https://${shop}/admin/api/${version}/graphql.json`;

    const query = `
      mutation CreateProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product { id title status handle }
          userErrors { field message }
        }
      }
    `;

    const variables = {
      input: {
        title: "Teste SobeAI (rascunho)",
        status: "DRAFT",
        descriptionHtml: "<p>Produto de teste criado pelo SobeAI.</p>",
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

    if (!resp.ok) {
      return res.status(resp.status).json({ ok: false, error: data });
    }

    const userErrors = data?.data?.productCreate?.userErrors || [];
    if (userErrors.length) {
      return res.status(400).json({ ok: false, userErrors, raw: data });
    }

    return res.status(200).json({ ok: true, result: data.data.productCreate.product });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
