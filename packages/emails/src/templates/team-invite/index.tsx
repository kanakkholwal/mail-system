import type { ReactElement } from 'react';
import {
  band, brandHeader, Callout, cta, DataList, divider, editorialCta, editorialHeadline, editorialKicker,
  editorialLede, fallbackLink, footer, hero, pullQuote, small, space,
} from '../../kit/index.js';
import { PHOTO, PHOTO_ALT } from '../../samples/photos.js';
import { defineTemplate } from '../../template.js';
import { demoBase } from '../../samples/common.js';
import { teamInviteSchema, type TeamInviteProps } from './schema.js';

const ROLE_SCOPE: Record<TeamInviteProps['role'], string> = {
  owner: 'Full control, including billing and deleting the workspace.',
  admin: 'Manage projects, members and settings. No access to billing.',
  member: 'Create and edit projects. Cannot change workspace settings.',
  viewer: 'Read-only access to projects. Cannot make changes.',
  billing: 'Access to invoices and payment methods only. No project access.',
};

export default defineTemplate<TeamInviteProps>({
  meta: {
    key: 'team_invite',
    name: 'Team invitation',
    genre: 'collaboration',
    description: 'Workspace invite that names the inviter and spells out exactly what the role can do.',
    modes: ['email', 'web'],
    primaryAction: 'Accept invitation',
    requiresUnsubscribe: false,
  },
  schema: teamInviteSchema,

  subject: (props) => `${props.inviter.name} invited you to ${props.workspaceName}`.slice(0, 78),

  sample: {
    ...demoBase,
    recipientName: 'Dev',
    previewText: 'Ama added you as a member. The invite expires in 14 days.',
    workspaceName: 'Kestrel Health',
    inviter: { name: 'Ama Boateng', email: 'ama@nexonauts.com' },
    role: 'member',
    acceptUrl: 'https://nexonauts.com/invites/accept?token=9f31c0ab7e',
    expiresInDays: 14,
    memberCount: 7,
    message: 'Putting you on the portal work. Everything from the audit is already in there.',
  },

  build(props, ctx): ReactElement[] {
    const rows: ReactElement[] = [brandHeader(ctx), hero({ src: PHOTO.teamInvite, alt: PHOTO_ALT.teamInvite })];

    rows.push(
      band(
        [
          ...editorialKicker('Invitation'),
          editorialHeadline(`${props.inviter.name} invited you to ${props.workspaceName}`),
          editorialLede(
            props.memberCount && props.memberCount > 1
              ? `You would be joining ${props.memberCount} people already working in ${props.workspaceName}.`
              : `${props.workspaceName} is set up and waiting for you.`,
          ),
          editorialCta(ctx, { label: 'Accept invitation', href: props.acceptUrl }),
          small(`This invite expires in <strong>${props.expiresInDays} days</strong>.`, { key: 'e', gap: space.md }),
          fallbackLink(ctx, props.acceptUrl),
        ],
        { pt: space.xl, pb: space.xl, key: 'hero-copy' },
      ),
    );

    // A note from a named person is a quote, not a system callout.
    if (props.message) {
      rows.push(pullQuote({ body: props.message, attribution: props.inviter.name, key: 'note' }));
    }

    rows.push(
      band(
        [
          divider({ gap: space.none, key: 'd' }),
          <DataList
            key="dl"
            rows={[
              { key: 'Workspace', value: props.workspaceName },
              { key: 'Invited by', value: `${props.inviter.name} (${props.inviter.email})` },
              { key: 'Your role', value: props.role.charAt(0).toUpperCase() + props.role.slice(1) },
            ]}
            containerPadding={`${space.md} 0px ${space.md} 0px`}
          />,
          // Spelling out the scope prevents the "why can I not see billing" ticket.
          small(`<strong>What ${props.role} can do.</strong> ${ROLE_SCOPE[props.role]}`, { key: 'scope', gap: space.none }),
        ],
        { pt: space.none, pb: space.xxl, key: 'detail' },
      ),
    );

    rows.push(...footer(ctx));
    return rows;
  },
});
