# Security Policy

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Instead, please report security issues by emailing: security@bundlenudge.dev

Include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes

## Response Timeline

- **24 hours**: Initial acknowledgment
- **72 hours**: Preliminary assessment
- **7 days**: Resolution plan or update

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | Yes       |
| < 1.0   | No        |

## Security Best Practices

When using BundleNudge:

1. **Keep your app key secret** - Never commit to source control
2. **Use HTTPS only** - All API calls should be over HTTPS
3. **Validate bundles** - SDK verifies bundle integrity with SHA-256
4. **Monitor rollback events** - High rollback rate may indicate issues
5. **Review release changes** - Audit code before pushing updates

## Disclosure Policy

We follow responsible disclosure:

1. Reporter submits vulnerability
2. We confirm and assess impact
3. We develop and test a fix
4. We release the fix
5. We publicly disclose (with reporter credit if desired)

Thank you for helping keep BundleNudge secure.
