const INVITE_CODE = '8chgr3Ad';

export async function onRequestGet() {
    try {
        const response = await fetch(`https://discord.com/api/v10/invites/${INVITE_CODE}?with_counts=true`, {
            headers: { accept: 'application/json' }
        });
        const invite = await response.json();
        if (!response.ok || !invite.guild) {
            return Response.json({ error: 'Discord invite unavailable' }, { status: 502 });
        }

        const iconExtension = invite.guild.icon?.startsWith('a_') ? 'gif' : 'webp';
        const icon = invite.guild.icon
            ? `https://cdn.discordapp.com/icons/${invite.guild.id}/${invite.guild.icon}.${iconExtension}?size=128`
            : null;

        return Response.json({
            name: invite.guild.name,
            icon,
            online: invite.approximate_presence_count,
            members: invite.approximate_member_count
        }, { headers: { 'cache-control': 'public, max-age=300' } });
    } catch {
        return Response.json({ error: 'Discord invite unavailable' }, { status: 502 });
    }
}
