// Supabase Edge Function: Send Push Notification
// Deploy with: supabase functions deploy send-notification
// Requires EXPO_ACCESS_TOKEN environment variable in Supabase

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const EXPO_ACCESS_TOKEN = Deno.env.get('EXPO_ACCESS_TOKEN');
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushNotificationPayload {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

serve(async (req: Request) => {
  try {
    const { token, title, body, data, priority } = await req.json();

    if (!token || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: token, title, body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!EXPO_ACCESS_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'EXPO_ACCESS_TOKEN not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const payload: PushNotificationPayload = {
      to: token,
      title,
      body,
      data: data || {},
      sound: 'default',
      priority: priority || 'normal',
    };

    const expoResponse = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${EXPO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await expoResponse.json();

    if (!expoResponse.ok) {
      console.error('Expo push error:', result);
      return new Response(
        JSON.stringify({ error: 'Failed to send push notification', details: result }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Notification error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
