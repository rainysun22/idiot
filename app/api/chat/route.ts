import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, apiKey, history } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 优先使用请求中的apiKey，否则从环境变量获取
    const zhipuApiKey = apiKey || process.env.ZHIPU_API_KEY || '';
    
    if (!zhipuApiKey) {
      return NextResponse.json(
        { error: 'API key is required. Please set ZHIPU_API_KEY in environment variables or provide it in the request.' },
        { status: 401 }
      );
    }

    // 构建消息历史
    const messages = [
      {
        role: 'system',
        content: `你是一个友好的AI助手，有一个3D机器人形象。
        请用简洁、自然的方式回复用户，保持对话友好、有帮助。
        适当表达情感和个性。
        回复控制在200字以内。`
      },
      ...(history || []),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${zhipuApiKey}`
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zhipu API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Failed to get response from AI: ${response.status}` },
        { status: response.status }
      );
    }

    // 返回可读流
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 支持 OPTIONS 请求
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
