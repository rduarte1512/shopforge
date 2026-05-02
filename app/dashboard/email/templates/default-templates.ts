interface TemplateData {
  subject: string;
  preview_text: string;
  html_content: string;
}

export function getDefaultTemplate(type: string, brandColor: string, storeName: string): TemplateData {
  const templates: Record<string, TemplateData> = {
    order_confirmation: {
      subject: `Confirmação da sua encomenda #{{order_id}}`,
      preview_text: 'Obrigado pela sua encomenda! Estamos a processá-la.',
      html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
  <h1 style="color:${brandColor};margin:0 0 24px;">${storeName}</h1>
  <h2 style="color:${brandColor};">Olá {{customer_name}},</h2>
  <p>Obrigado pela sua encomenda! Recebemos a sua encomenda e estamos a processá-la.</p>
  <p><strong>Encomenda:</strong> #{{order_id}}</p>
  <p><strong>Total:</strong> {{total}}</p>
  <table style="width:100%;border-collapse:collapse;margin:20px 0;">
    <thead>
      <tr style="background:${brandColor};color:white;">
        <th style="padding:12px;text-align:left;">Produto</th>
        <th style="padding:12px;text-align:center;">Qtd</th>
        <th style="padding:12px;text-align:right;">Preço</th>
      </tr>
    </thead>
    <tbody>
      {{items}}
    </tbody>
  </table>
  <p style="color:#666;font-size:14px;margin-top:32px;">Receberá um email quando a sua encomenda for enviada.</p>
</body>
</html>`,
    },
    order_status: {
      subject: `Atualização da encomenda #{{order_id}} - {{status}}`,
      preview_text: 'O estado da sua encomenda foi atualizado.',
      html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
  <h1 style="color:${brandColor};margin:0 0 24px;">${storeName}</h1>
  <h2 style="color:${brandColor};">Olá {{customer_name}},</h2>
  <p>O estado da sua encomenda foi atualizado:</p>
  <div style="background:#f9f9f9;padding:16px;border-radius:8px;margin:20px 0;">
    <p><strong>Encomenda:</strong> #{{order_id}}</p>
    <p><strong>Estado:</strong> {{status}}</p>
    {{tracking_info}}
  </div>
  <p style="color:#666;font-size:14px;margin-top:32px;">Obrigado pela sua confiança!</p>
</body>
</html>`,
    },
    cart_recovery: {
      subject: 'Esqueceu-se do seu carrinho?',
      preview_text: 'Tem produtos à sua espera que não quer perder.',
      html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
  <h1 style="color:${brandColor};margin:0 0 24px;">${storeName}</h1>
  <h2 style="color:${brandColor};">Olá {{customer_name}},</h2>
  <p>Parece que deixou alguns produtos no seu carrinho. Não os deixe escapar!</p>
  <table style="width:100%;border-collapse:collapse;margin:20px 0;">
    <thead>
      <tr style="background:${brandColor};color:white;">
        <th style="padding:12px;text-align:left;">Produto</th>
        <th style="padding:12px;text-align:center;">Qtd</th>
        <th style="padding:12px;text-align:right;">Preço</th>
      </tr>
    </thead>
    <tbody>
      {{items}}
    </tbody>
  </table>
  <div style="text-align:center;margin:30px 0;">
    <a href="{{cart_url}}" style="display:inline-block;padding:14px 28px;background:${brandColor};color:white;text-decoration:none;border-radius:8px;font-weight:bold;">Completar Encomenda</a>
  </div>
  <p style="color:#666;font-size:14px;">Tem alguma dúvida? Estamos aqui para ajudar!</p>
</body>
</html>`,
    },
    welcome: {
      subject: 'Bem-vindo a ' + storeName,
      preview_text: 'Obrigado por se registar na nossa loja.',
      html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
  <h1 style="color:${brandColor};margin:0 0 24px;">${storeName}</h1>
  <h2 style="color:${brandColor};">Bem-vindo, {{customer_name}}!</h2>
  <p>Obrigado por se registar na nossa loja. Estamos muito felizes por tê-lo connosco!</p>
  <p>A partir de agora pode:</p>
  <ul style="line-height:1.8;">
    <li>Explorar o nosso catálogo de produtos</li>
    <li>Guardar os seus favoritos</li>
    <li>Acompanhar as suas encomendas</li>
    <li>Receber promoções exclusivas</li>
  </ul>
  <div style="text-align:center;margin:30px 0;">
    <a href="{{shop_url}}" style="display:inline-block;padding:14px 28px;background:${brandColor};color:white;text-decoration:none;border-radius:8px;font-weight:bold;">Ver Produtos</a>
  </div>
  <p style="color:#666;font-size:14px;">Tem alguma dúvida? Estamos aqui para ajudar!</p>
</body>
</html>`,
    },
    newsletter: {
      subject: '{{subject}}',
      preview_text: '{{preview_text}}',
      html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
  <h1 style="color:${brandColor};margin:0 0 24px;">${storeName}</h1>
  {{content}}
  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;text-align:center;">
    <p style="color:#666;font-size:12px;">
      <a href="{{unsubscribe_url}}" style="color:#666;">Unsubscribe</a> |
      <a href="{{shop_url}}" style="color:#666;">Visit our store</a>
    </p>
  </div>
</body>
</html>`,
    },
  };

  return templates[type] || templates.order_confirmation;
}