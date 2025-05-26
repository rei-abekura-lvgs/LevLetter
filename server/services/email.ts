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
  from = process.env.SES_FROM_EMAIL || "rei.abekura@leverages.jp"
}: EmailParams): Promise<boolean> {
  try {
    // 送信情報をログに表示（デバッグ用）
    console.log(`📧 メール送信試行:`);
    console.log(`   - 宛先: ${to}`);
    console.log(`   - 件名: ${subject}`);
    console.log(`   - 送信元: ${from}`);
    console.log(`   - AWS リージョン: ${process.env.AWS_REGION}`);
    
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
    console.log("✅ メール送信成功:", response.MessageId);
    return true;
  } catch (error) {
    console.error("❌ AWS SES メール送信エラー詳細:");
    console.error("   - エラーコード:", (error as any).name);
    console.error("   - エラーメッセージ:", (error as any).message);
    console.error("   - HTTPステータス:", (error as any)?.$metadata?.httpStatusCode);
    console.error("   - 詳細情報:", error);
    return false;
  }
}

/**
 * パスワードリセット用メールテンプレート
 */
export function getPasswordResetEmailTemplate({
  userName,
  resetLink
}: {
  userName: string,
  resetLink: string
}): { html: string; text: string } {
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
        <p>以下のボタンをクリックしてパスワードリセット画面に移動してください：</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            パスワードをリセットする
          </a>
        </div>
        
        <p><strong>手順：</strong></p>
        <ol>
          <li>上記のボタンをクリックしてパスワードリセット画面にアクセス</li>
          <li>新しいパスワードを設定</li>
        </ol>
        
        <p>このコードは24時間有効です。リクエストしていない場合は、このメールを無視してください。</p>
        <p>何かご不明な点がございましたら、システム管理者にお問い合わせください。</p>
        <p>よろしくお願いいたします。<br>LevLetter管理チーム</p>
      </div>
    </body>
    </html>
  `;

  const text = `
こんにちは、${userName} さん

あなたのアカウントのパスワードリセットリクエストを受け付けました。

以下のURLにアクセスしてパスワードをリセットしてください：
${resetLink}

手順：
1. 上記のURLにアクセスしてパスワードリセット画面に移動
2. 新しいパスワードを設定

このコードは24時間有効です。リクエストしていない場合は、このメールを無視してください。
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