import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AvatarGenerationRequest {
  name: string;
  department?: string;
  email: string;
}

export interface AvatarGenerationResult {
  success: boolean;
  avatarUrl?: string;
  fallbackColor?: string;
  error?: string;
}

/**
 * ユーザー情報を基にプロフェッショナルなアバター生成プロンプトを作成
 */
function createAvatarPrompt(userInfo: AvatarGenerationRequest): string {
  const { name, department } = userInfo;
  
  const departmentStyle = department ? getDepartmentStyle(department) : 'professional business';
  
  return `Create a professional, friendly avatar for a Japanese business person named ${name} who works in ${department || 'a corporate environment'}. 

Style requirements:
- ${departmentStyle} aesthetic
- Clean, minimalist design suitable for corporate use
- Friendly and approachable expression
- Professional business attire
- Neutral background or subtle gradient
- High quality, suitable for profile pictures
- Gender-neutral or appropriate representation
- Modern flat design style with soft shadows

The avatar should feel warm and professional, suitable for internal company communications and team interactions.`;
}

/**
 * 部署に応じたスタイルを決定
 */
function getDepartmentStyle(department: string): string {
  const dept = department.toLowerCase();
  
  if (dept.includes('システム') || dept.includes('エンジニア') || dept.includes('tech')) {
    return 'modern tech-savvy professional with subtle technical elements';
  } else if (dept.includes('営業') || dept.includes('sales')) {
    return 'confident business professional with dynamic energy';
  } else if (dept.includes('マーケ') || dept.includes('marketing')) {
    return 'creative professional with modern design sensibility';
  } else if (dept.includes('人事') || dept.includes('hr')) {
    return 'warm and approachable professional with people-focused energy';
  } else if (dept.includes('財務') || dept.includes('経理') || dept.includes('finance')) {
    return 'trustworthy and detail-oriented professional';
  } else {
    return 'versatile business professional';
  }
}

/**
 * ランダムなアバターカラーを生成（フォールバック用）
 */
function generateFallbackColor(): string {
  const colors = [
    'blue-500', 'green-500', 'purple-500', 'red-500', 'yellow-500',
    'indigo-500', 'pink-500', 'teal-500', 'orange-500', 'cyan-500'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * AIアバター生成（将来の実装のための準備）
 * 現在はプロンプト生成とフォールバック機能を提供
 */
export async function generateUserAvatar(userInfo: AvatarGenerationRequest): Promise<AvatarGenerationResult> {
  try {
    console.log(`🎨 ${userInfo.name}さんのアバター生成を開始...`);
    
    // AIプロンプトを生成
    const prompt = createAvatarPrompt(userInfo);
    console.log('🤖 生成プロンプト:', prompt);
    
    // Claude AIを使用してアバター設計の提案を生成
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Based on this avatar request: "${prompt}"

Please provide a detailed description for creating a professional avatar image. Include:
1. Visual style and composition
2. Color palette suggestions
3. Specific design elements
4. Overall mood and personality

Respond in a structured format that could be used for image generation.`
      }],
    });

    const avatarDescription = response.content[0].text;
    console.log('✨ AI生成アバター設計:', avatarDescription);

    // 現在は美しいSVGアバターを生成するフォールバック
    const fallbackColor = generateFallbackColor();
    
    return {
      success: true,
      fallbackColor,
      avatarUrl: undefined // 将来的にAI生成画像URLを返す
    };
    
  } catch (error) {
    console.error('❌ アバター生成エラー:', error);
    
    return {
      success: false,
      fallbackColor: generateFallbackColor(),
      error: error instanceof Error ? error.message : '不明なエラー'
    };
  }
}

/**
 * SVGベースの美しいアバターを生成
 */
export function generateSVGAvatar(userInfo: AvatarGenerationRequest, color: string = 'blue-500'): string {
  const initials = userInfo.name
    .split(/\s+/)
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  const colorMap: Record<string, string> = {
    'blue-500': '#3B82F6',
    'green-500': '#10B981',
    'purple-500': '#8B5CF6',
    'red-500': '#EF4444',
    'yellow-500': '#F59E0B',
    'indigo-500': '#6366F1',
    'pink-500': '#EC4899',
    'teal-500': '#14B8A6',
    'orange-500': '#F97316',
    'cyan-500': '#06B6D4'
  };

  const bgColor = colorMap[color] || colorMap['blue-500'];

  return `
    <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="avatar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${bgColor}dd;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.15"/>
        </filter>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#avatar-gradient)" filter="url(#shadow)"/>
      <text x="60" y="75" text-anchor="middle" fill="white" font-family="Inter, system-ui, sans-serif" font-size="28" font-weight="600">${initials}</text>
    </svg>
  `;
}