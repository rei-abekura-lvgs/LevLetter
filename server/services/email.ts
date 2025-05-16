import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// AWS SES クライアント設定
const ses = new SESClient({
  region: process.env.AWS_REGION || "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

interface EmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  from?: string;
}

/**
 * AWS SESを使用してメールを送信する
 */
export async function sendEmail({
  to,
  subject,
  htmlContent,
  textContent,
  from = process.env.DEFAULT_FROM_EMAIL || "noreply@example.com"
}: EmailParams): Promise<boolean> {
  try {
    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: htmlContent,
          },
          Text: {
            Charset: "UTF-8",
            Data: textContent,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: subject,
        },
      },
      Source: from,
    });

    const response = await ses.send(command);
    console.log("メール送信成功:", response);
    return true;
  } catch (error) {
    console.error("メール送信エラー:", error);
    return false;
  }
}

/**
 * パスワードリセット用メールテンプレート
 */
export function getPasswordResetEmailTemplate(
  userName: string,
  resetLink: string
): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>パスワードリセット</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; border-top: 4px solid #4f46e5;">
        <h2 style="color: #4f46e5; margin-top: 0;">パスワードリセットのお知らせ</h2>
        <p>こんにちは、${userName} さん</p>
        <p>あなたのアカウントのパスワードリセットリクエストを受け付けました。</p>
        <p>以下のリンクをクリックして、新しいパスワードを設定してください：</p>
        <p style="margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">パスワードをリセット</a>
        </p>
        <p>このリンクは24時間有効です。リクエストしていない場合は、このメールを無視してください。</p>
        <p>何かご不明な点がございましたら、システム管理者にお問い合わせください。</p>
        <p>よろしくお願いいたします。<br>LevLetter管理チーム</p>
      </div>
    </body>
    </html>
  `;

  const text = `
こんにちは、${userName} さん

あなたのアカウントのパスワードリセットリクエストを受け付けました。
以下のリンクをクリックして、新しいパスワードを設定してください：

${resetLink}

このリンクは24時間有効です。リクエストしていない場合は、このメールを無視してください。
何かご不明な点がございましたら、システム管理者にお問い合わせください。

よろしくお願いいたします。
LevLetter管理チーム
  `;

  return { html, text };
}

/**
 * アカウント作成完了メールテンプレート
 */
export function getWelcomeEmailTemplate(
  userName: string,
  loginLink: string
): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>LevLetterへようこそ</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; border-top: 4px solid #4f46e5;">
        <h2 style="color: #4f46e5; margin-top: 0;">LevLetterへようこそ</h2>
        <p>こんにちは、${userName} さん</p>
        <p>LevLetterへの登録が完了しました！</p>
        <p>LevLetterは、同僚への感謝の気持ちを伝え、ポイントを付与できる社内コミュニケーションツールです。</p>
        <p>以下のリンクからログインして、早速利用を開始しましょう：</p>
        <p style="margin: 30px 0;">
          <a href="${loginLink}" style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">ログイン</a>
        </p>
        <p>何かご不明な点がございましたら、システム管理者にお問い合わせください。</p>
        <p>よろしくお願いいたします。<br>LevLetter管理チーム</p>
      </div>
    </body>
    </html>
  `;

  const text = `
こんにちは、${userName} さん

LevLetterへの登録が完了しました！
LevLetterは、同僚への感謝の気持ちを伝え、ポイントを付与できる社内コミュニケーションツールです。

以下のリンクからログインして、早速利用を開始しましょう：
${loginLink}

何かご不明な点がございましたら、システム管理者にお問い合わせください。

よろしくお願いいたします。
LevLetter管理チーム
  `;

  return { html, text };
}