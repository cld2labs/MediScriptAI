# Security Policy

The **CodeTrans — AI-Powered Code Translation** blueprint does not include
production-grade security controls.

This repository is not secure by default and must not be used in production
without a comprehensive security review.

## Known Considerations

- **API tokens**: `INFERENCE_API_TOKEN` is loaded from `.env`.
  Never commit `.env` to version control.
- **CORS**: `CORS_ALLOW_ORIGINS` defaults to `*`. Restrict to specific origins in
  any non-local deployment.
- **SSL verification**: `VERIFY_SSL=false` disables certificate validation. Only
  use this in controlled development environments.
- **Source code privacy**: Code submitted for translation is sent to the configured
  inference endpoint. Do not use third-party cloud APIs with proprietary or
  sensitive source code.

## User Responsibilities

Users are responsible for implementing appropriate:

- Authentication and authorization mechanisms
- Encryption and secure data storage
- Network-level access controls and firewall rules
- Monitoring, logging, and auditing
- Regulatory and compliance safeguards relevant to their deployment environment

## Reporting a Vulnerability

If you discover a security vulnerability in this blueprint, please report it
privately to the Cloud2 Labs maintainers rather than opening a public issue.
