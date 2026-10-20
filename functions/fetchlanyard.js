export async function onRequestGet() {
    const response = await fetch('https://api.lanyard.rest/v1/users/458318691172352012');
    if (!response.ok) {
        return Response.json({ error: 'Discord presence unavailable' }, { status: 502 });
    }

    const { data } = await response.json();
    return Response.json({
        discord_user: data.discord_user,
        discord_status: data.discord_status,
        activities: data.activities
    }, { headers: { 'cache-control': 'no-store' } });
}