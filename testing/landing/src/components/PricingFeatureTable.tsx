import { Fragment } from 'react'
import { CheckIcon, XIcon } from './icons'

const features = [
  {
    category: 'Updates',
    items: [
      { name: 'Updates per month', free: '1,000', pro: '10,000', team: '50,000' },
      { name: 'OTA bundle delivery', free: true, pro: true, team: true },
      { name: 'Staged rollouts (% based)', free: true, pro: true, team: true },
      { name: 'Instant rollback', free: true, pro: true, team: true },
      { name: 'Update channels (prod, staging)', free: '2', pro: '5', team: 'Unlimited' },
    ],
  },
  {
    category: 'Apps & Team',
    items: [
      { name: 'Apps', free: '1', pro: '3', team: '10' },
      { name: 'Team members', free: '1', pro: '5', team: '20' },
      { name: 'Role-based access control', free: false, pro: true, team: true },
    ],
  },
  {
    category: 'Targeting & Testing',
    items: [
      { name: 'App version targeting', free: true, pro: true, team: true },
      { name: 'Platform targeting (iOS/Android)', free: true, pro: true, team: true },
      { name: 'A/B testing', free: false, pro: true, team: true },
      { name: 'Device targeting', free: false, pro: false, team: true },
      { name: 'User segment targeting', free: false, pro: false, team: true },
    ],
  },
  {
    category: 'Security & Compliance',
    items: [
      { name: 'Code signing', free: true, pro: true, team: true },
      { name: 'HTTPS delivery', free: true, pro: true, team: true },
      { name: 'Audit logs', free: false, pro: true, team: true },
      { name: 'SSO (SAML/OIDC)', free: false, pro: false, team: true },
    ],
  },
  {
    category: 'Analytics & Insights',
    items: [
      { name: 'Update adoption metrics', free: true, pro: true, team: true },
      { name: 'Error tracking integration', free: false, pro: true, team: true },
      { name: 'Custom dashboards', free: false, pro: false, team: true },
    ],
  },
  {
    category: 'Support & Delivery',
    items: [
      { name: 'Cloudflare edge delivery', free: true, pro: true, team: true },
      { name: 'Community support', free: true, pro: true, team: true },
      { name: 'Email support', free: false, pro: true, team: true },
      { name: 'Priority support', free: false, pro: false, team: true },
      { name: 'SLA guarantee', free: false, pro: false, team: true },
    ],
  },
]

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <CheckIcon className="w-5 h-5 text-green-600 mx-auto" />
    ) : (
      <XIcon className="w-5 h-5 text-gray-300 mx-auto" />
    )
  }
  return <span className="text-text-dark font-medium">{value}</span>
}

export function PricingFeatureTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-4 px-4 font-bold text-text-dark">
              Features
            </th>
            <th className="text-center py-4 px-4 w-32">
              <div className="font-bold text-text-dark">Free</div>
              <div className="text-sm text-text-light">$0/mo</div>
            </th>
            <th className="text-center py-4 px-4 w-32 bg-bright-accent/5 rounded-t-xl">
              <div className="font-bold text-bright-accent">Pro</div>
              <div className="text-sm text-text-light">$29/mo</div>
            </th>
            <th className="text-center py-4 px-4 w-32">
              <div className="font-bold text-text-dark">Team</div>
              <div className="text-sm text-text-light">$99/mo</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {features.map((category) => (
            <Fragment key={category.category}>
              <tr className="bg-gray-50">
                <td
                  colSpan={4}
                  className="py-3 px-4 font-bold text-text-dark text-sm uppercase tracking-wide"
                >
                  {category.category}
                </td>
              </tr>
              {category.items.map((item) => (
                <tr
                  key={item.name}
                  className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-3 px-4 text-text-light">{item.name}</td>
                  <td className="py-3 px-4 text-center">
                    <FeatureValue value={item.free} />
                  </td>
                  <td className="py-3 px-4 text-center bg-bright-accent/5">
                    <FeatureValue value={item.pro} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <FeatureValue value={item.team} />
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
