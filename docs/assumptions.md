# RosterIQ — Technical & Operational Assumptions

The following assumptions were made during design and implementation to provide a realistic, robust solution within the assessment timeline:

1. **Daily Work Shift Structure**: Standard shifts run 9:00 AM to 6:00 PM (8 working hours + 1 hour lunch/break). Standard daily capacity is 8.0 hours.
2. **Single-Resource Brands (80%)**: The dedicated employee handles all processes for that brand. Workload across assigned processes is distributed proportionally (e.g. 50% CS / 50% ACC = 4h CS / 4h ACC) to respect daily capacity.
3. **Multi-Resource Brands (20%)**: Primary employees are typically dedicated to distinct processes (e.g., one on CS, one on ACC, one on NDR) to ensure continuous coverage, with cross-coverage backup rules in place.
4. **Public Holiday Scope**: Gazetted public holidays apply pan-India by default, but brand-level exceptions can override them for clients running 365-day support.
5. **Pending Leaves**: As mandated, pending leave requests are visible in the leave management queue but do NOT block scheduling until explicitly approved by an operations manager.
6. **Publishing Invariant**: A roster cannot transition to `PUBLISHED` status if unresolved critical conflicts or unstaffed mandatory coverage slots exist.
7. **Database Compatibility**: The engine uses SQLAlchemy 2.0 ORM compatible with Neon Serverless PostgreSQL with SSL. SQLite is supported for fast local automated testing.
