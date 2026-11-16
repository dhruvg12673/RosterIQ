"""
RosterIQ Seed Data Generator
Generates realistic enterprise workforce dataset:
- 38 Employees with realistic Indian names
- 6 Operational Pods with Pod Leads
- 20 Fictional D2C Brands (16 single-resource, 4 multi-resource)
- 5 Configurable Operational Processes
- Diverse Operating Calendars per brand/process
- Primary & Backup Employee Assignments
- Weekly Off Rules
- Public Holidays & Exceptions
- Approved Leaves, Pending Leaves, Comp-Offs, and Unavailability
"""
import sys
import os
from datetime import date, time, datetime, timedelta

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.core.database import SessionLocal, Base, engine
from app.models.models import (
    Pod, Employee, Brand, Process, BrandProcessRule,
    EmployeeAssignment, PublicHoliday, PublicHolidayBrandException,
    EmployeeAvailability, LeaveRequest, WeeklyOffRule
)


def seed():
    # Make sure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("🌱 Starting RosterIQ Database Seeding...")

        # 1. Clear existing base data if any
        # Delete in reverse foreign key order
        db.query(PublicHolidayBrandException).delete()
        db.query(PublicHoliday).delete()
        db.query(LeaveRequest).delete()
        db.query(EmployeeAvailability).delete()
        db.query(WeeklyOffRule).delete()
        db.query(EmployeeAssignment).delete()
        db.query(BrandProcessRule).delete()
        db.query(Brand).delete()
        db.query(Process).delete()
        
        # Clear pod leads first to break circular FK with employees
        db.query(Pod).update({Pod.pod_lead_employee_id: None})
        db.commit()
        db.query(Employee).delete()
        db.query(Pod).delete()
        db.commit()

        # 2. Create 6 Operational Pods
        pods_data = [
            ("Alpha Titans", "POD-AT", "Handles high-velocity FMCG and wellness brands"),
            ("Beta Blitz", "POD-BB", "Specializes in fashion, luxury apparel, and jewelry"),
            ("Gamma Guardians", "POD-GG", "Dedicated to consumer electronics, audio, and gadgets"),
            ("Delta Dynamos", "POD-DD", "Focuses on home lifestyle, sleep essentials, and kitchenware"),
            ("Epsilon Elite", "POD-EE", "Expert in beauty, personal care, and organic food"),
            ("Zeta Zenith", "POD-ZZ", "Enterprise operations, high-tier omnichannel clients"),
        ]

        pods = []
        for name, code, desc in pods_data:
            p = Pod(pod_name=name, pod_code=code, description=desc)
            db.add(p)
            pods.append(p)
        db.commit()
        for p in pods:
            db.refresh(p)
        print(f"✅ Created {len(pods)} Pods")

        # 3. Create 5 Operational Processes
        processes_data = [
            ("Customer Support", "CS", "Inbound customer queries via chat, email, phone, and WhatsApp"),
            ("Abandoned Cart Conversion", "ACC", "Outbound cart recovery, WhatsApp follow-ups, and conversion offers"),
            ("Retention", "RET", "Post-purchase customer engagement, repeat orders, and loyalty support"),
            ("Non-Delivery Report", "NDR", "Courier NDR management, address validation, re-attempt coordination"),
            ("Operations & Escalations", "OPS", "Level 2 dispute resolution, logistics escalations, and marketplace operations"),
        ]

        processes = {}
        for name, code, desc in processes_data:
            proc = Process(process_name=name, process_code=code, description=desc, status="ACTIVE")
            db.add(proc)
            processes[code] = proc
        db.commit()
        for k in processes:
            db.refresh(processes[k])
        print(f"✅ Created {len(processes)} Operational Processes")

        # 4. Create 38 Realistic Employees
        employees_data = [
            # Pod Leads (6)
            ("EMP001", "Aarav Sharma", "aarav.sharma@datastraw.in", "+91-9811012345", "Pod Lead", 0, "Sunday"),
            ("EMP002", "Priya Nair", "priya.nair@datastraw.in", "+91-9822012346", "Pod Lead", 1, "Sunday"),
            ("EMP003", "Rohan Verma", "rohan.verma@datastraw.in", "+91-9833012347", "Pod Lead", 2, "Sunday"),
            ("EMP004", "Ananya Iyer", "ananya.iyer@datastraw.in", "+91-9844012348", "Pod Lead", 3, "Sunday"),
            ("EMP005", "Vikram Malhotra", "vikram.malhotra@datastraw.in", "+91-9855012349", "Pod Lead", 4, "Sunday"),
            ("EMP006", "Sneha Patel", "sneha.patel@datastraw.in", "+91-9866012350", "Pod Lead", 5, "Sunday"),

            # Dedicated Primary Employees for Single-Resource Brands (16 employees: EMP007 - EMP022)
            ("EMP007", "Aditya Joshi", "aditya.joshi@datastraw.in", "+91-9877012351", "Brand Specialist", 0, "Sunday"),
            ("EMP008", "Kavya Menon", "kavya.menon@datastraw.in", "+91-9888012352", "Brand Specialist", 0, "Saturday"),
            ("EMP009", "Kabir Sen", "kabir.sen@datastraw.in", "+91-9899012353", "Brand Specialist", 0, "Sunday"),
            ("EMP010", "Tanvi Rao", "tanvi.rao@datastraw.in", "+91-9810012354", "Brand Specialist", 1, "Sunday"),
            ("EMP011", "Ishaan Kapoor", "ishaan.kapoor@datastraw.in", "+91-9821012355", "Brand Specialist", 1, "Monday"),
            ("EMP012", "Diya Mukherjee", "diya.mukherjee@datastraw.in", "+91-9832012356", "Brand Specialist", 1, "Sunday"),
            ("EMP013", "Siddharth Gupta", "siddharth.gupta@datastraw.in", "+91-9843012357", "Brand Specialist", 2, "Sunday"),
            ("EMP014", "Meera Kulkarni", "meera.kulkarni@datastraw.in", "+91-9854012358", "Brand Specialist", 2, "Saturday"),
            ("EMP015", "Arjun Reddy", "arjun.reddy@datastraw.in", "+91-9865012359", "Brand Specialist", 2, "Sunday"),
            ("EMP016", "Rhea Deshmukh", "rhea.deshmukh@datastraw.in", "+91-9876012360", "Brand Specialist", 3, "Sunday"),
            ("EMP017", "Karan Singhania", "karan.singhania@datastraw.in", "+91-9887012361", "Brand Specialist", 3, "Tuesday"),
            ("EMP018", "Pooja Hegde", "pooja.hegde@datastraw.in", "+91-9898012362", "Brand Specialist", 3, "Sunday"),
            ("EMP019", "Nikhil Chopra", "nikhil.chopra@datastraw.in", "+91-9809012363", "Brand Specialist", 4, "Sunday"),
            ("EMP020", "Zoya Khan", "zoya.khan@datastraw.in", "+91-9819012364", "Brand Specialist", 4, "Friday"),
            ("EMP021", "Varun Bhatia", "varun.bhatia@datastraw.in", "+91-9829012365", "Brand Specialist", 5, "Sunday"),
            ("EMP022", "Anushka Saxena", "anushka.saxena@datastraw.in", "+91-9839012366", "Brand Specialist", 5, "Wednesday"),

            # Multi-Resource Brand Staff (10 employees: EMP023 - EMP032)
            ("EMP023", "Gaurav Pandey", "gaurav.pandey@datastraw.in", "+91-9849012367", "Senior Support Associate", 2, "Sunday"),
            ("EMP024", "Ritu Agarwal", "ritu.agarwal@datastraw.in", "+91-9859012368", "Conversion Specialist", 2, "Saturday"),
            ("EMP025", "Manish Tiwari", "manish.tiwari@datastraw.in", "+91-9869012369", "Logistics Associate", 2, "Sunday"),

            ("EMP026", "Neha Chauhan", "neha.chauhan@datastraw.in", "+91-9879012370", "Senior Support Associate", 4, "Sunday"),
            ("EMP027", "Alok Mishra", "alok.mishra@datastraw.in", "+91-9889012371", "Growth Associate", 4, "Monday"),
            ("EMP028", "Swati Pillai", "swati.pillai@datastraw.in", "+91-9899012372", "Retention Lead", 4, "Sunday"),

            ("EMP029", "Harsh Vardhan", "harsh.vardhan@datastraw.in", "+91-9801012373", "Customer Experience Associate", 1, "Sunday"),
            ("EMP030", "Deepika Roy", "deepika.roy@datastraw.in", "+91-9812012374", "Logistics & Care Specialist", 1, "Saturday"),

            ("EMP031", "Sanjay Nambiar", "sanjay.nambiar@datastraw.in", "+91-9823012375", "Operations Associate", 3, "Sunday"),
            ("EMP032", "Kritika Soni", "kritika.soni@datastraw.in", "+91-9834012376", "Customer Success Associate", 3, "Thursday"),

            # Floaters / Cross-Brand Backup Resources (6 employees: EMP033 - EMP038)
            ("EMP033", "Rahul Bose", "rahul.bose@datastraw.in", "+91-9845012377", "Floater Specialist", 0, "Sunday"),
            ("EMP034", "Shalini Das", "shalini.das@datastraw.in", "+91-9856012378", "Floater Specialist", 1, "Sunday"),
            ("EMP035", "Abhinav Ghosh", "abhinav.ghosh@datastraw.in", "+91-9867012379", "Floater Specialist", 2, "Monday"),
            ("EMP036", "Sunita Rao", "sunita.rao@datastraw.in", "+91-9878012380", "Floater Specialist", 3, "Sunday"),
            ("EMP037", "Chirag Sethi", "chirag.sethi@datastraw.in", "+91-9889012381", "Floater Specialist", 4, "Saturday"),
            ("EMP038", "Bhavna Jain", "bhavna.jain@datastraw.in", "+91-9890012382", "Floater Specialist", 5, "Sunday"),
        ]

        employees = []
        for code, name, email, phone, desig, pod_idx, pref_off in employees_data:
            emp = Employee(
                employee_code=code,
                full_name=name,
                email=email,
                phone=phone,
                designation=desig,
                pod_id=pods[pod_idx].id,
                joining_date=date(2023, 1, 15),
                employment_status="ACTIVE",
                daily_capacity_hours=8.0,
                weekly_off_count=1,
                preferred_weekly_off_days=pref_off
            )
            db.add(emp)
            employees.append(emp)
        db.commit()

        for e in employees:
            db.refresh(e)
        print(f"✅ Created {len(employees)} Employees")

        # Assign Pod Leads
        for i in range(6):
            pods[i].pod_lead_employee_id = employees[i].id
        db.commit()
        print("✅ Assigned 6 Pod Leads")

        # 5. Create 20 Fictional D2C Brands (16 Single-Resource, 4 Multi-Resource)
        brands_data = [
            # 16 Single-Resource Brands (80%)
            ("GlowAura Skincare", "BRD-GLOW", "Clean botanical serums & moisturizers"),
            ("MunchFit Healthy Snacks", "BRD-SNACK", "Roasted millet snacks & protein bars"),
            ("ChaiVeda Herbal Teas", "BRD-CHAI", "Artisanal ayurvedic tea blends"),
            ("UrbanStitch Denim", "BRD-DENIM", "Sustainable premium stretch jeans"),
            ("FitPro Nutrition", "BRD-BEAST", "Whey protein, creatine & sports nutrition"),
            ("KashmirBliss Saffron", "BRD-SPICE", "Organic GI-tagged saffron & wild honey"),
            ("SpectaClear Eyewear", "BRD-LENSE", "Direct-to-consumer blue-light blocking glasses"),
            ("EcoClean Solutions", "BRD-CLEAN", "Zero-waste home cleaners & laundry sheets"),
            ("LittleSprouts Kids", "BRD-KIDS", "Organic cotton baby wear & rompers"),
            ("PawPals Pet Care", "BRD-PETS", "Vet-approved raw dog food & supplements"),
            ("SoundWave Audio", "BRD-AUDIO", "Active noise cancelling wireless earbuds"),
            ("SoleCrafters Footwear", "BRD-SHOES", "Handmade orthotic leather dress shoes"),
            ("AromaHaven Candles", "BRD-CANDL", "Hand-poured soy wax scented candles"),
            ("RestEasy Sleep", "BRD-MATT", "Cooling memory foam mattresses & pillows"),
            ("ZariGems Silver", "BRD-JEWEL", "Contemporary 925 hallmarked silver jewelry"),
            ("PureHarvest Oils", "BRD-ORGAN", "Wood cold-pressed virgin cooking oils"),

            # 4 Multi-Resource Brands (20%)
            ("TitanTech Smart Gadgets", "BRD-TITAN", "Wearable fitness trackers, smartwatches & accessories"),
            ("NutriLife Superfoods", "BRD-VITA", "Organic greens powders, effervescent vitamins & electrolytes"),
            ("VelvetCouture Fashion", "BRD-LUXE", "Designer women's ethnic wear & occasion bridal lehengas"),
            ("ApexMotor Spares", "BRD-AUTO", "Aftermarket performance automotive spares & accessories"),
        ]

        brands = []
        for name, code, desc in brands_data:
            b = Brand(brand_name=name, brand_code=code, description=desc, status="ACTIVE")
            db.add(b)
            brands.append(b)
        db.commit()
        for b in brands:
            db.refresh(b)
        print(f"✅ Created {len(brands)} Brands (16 Single-Resource, 4 Multi-Resource)")

        # 6. Configure Brand Process Rules (with different operating calendars)
        # Single-Resource Brands (0 to 15): Assigned 2 to 3 processes each
        # Different processes under the same brand have different calendars!
        brand_rules_plan = [
            # GlowAura: CS is 365 days; ACC daily except holidays; RET Sundays off
            (0, [
                ("CS", "ALL_DAYS", 1, 4.0, True, True),
                ("ACC", "DAILY_EXCEPT_PUBLIC_HOLIDAYS", 1, 2.0, True, False),
                ("RET", "SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF", 1, 2.0, False, False),
            ]),
            # MunchFit: CS 365 days, NDR daily except holidays, ACC Sundays off
            (1, [
                ("CS", "ALL_DAYS", 1, 4.0, True, True),
                ("NDR", "DAILY_EXCEPT_PUBLIC_HOLIDAYS", 1, 2.0, True, False),
                ("ACC", "SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF", 1, 2.0, False, False),
            ]),
            # ChaiVeda: CS daily except holidays, ACC custom (Mon-Fri)
            (2, [
                ("CS", "DAILY_EXCEPT_PUBLIC_HOLIDAYS", 1, 5.0, False, False),
                ("ACC", "CUSTOM_WEEKDAY_PATTERN", 1, 3.0, False, False, "Monday,Tuesday,Wednesday,Thursday,Friday"),
            ]),
            # UrbanStitch: CS 365 days, NDR daily except holidays, RET Sundays off
            (3, [
                ("CS", "ALL_DAYS", 1, 4.0, True, True),
                ("NDR", "DAILY_EXCEPT_PUBLIC_HOLIDAYS", 1, 2.0, True, False),
                ("RET", "SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF", 1, 2.0, False, False),
            ]),
            # FitPro: CS 365 days, ACC daily except holidays, NDR Mon-Sat
            (4, [
                ("CS", "ALL_DAYS", 1, 4.0, True, True),
                ("ACC", "DAILY_EXCEPT_PUBLIC_HOLIDAYS", 1, 2.0, True, False),
                ("NDR", "SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF", 1, 2.0, False, False),
            ]),
            # KashmirBliss: CS daily except holidays, ACC Mon-Sat
            (5, [
                ("CS", "DAILY_EXCEPT_PUBLIC_HOLIDAYS", 1, 5.0, False, False),
                ("ACC", "SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF", 1, 3.0, False, False),
            ]),
            # SpectaClear: CS 365 days, NDR daily except holidays
            (6, [
                ("CS", "ALL_DAYS", 1, 5.0, True, True),
                ("NDR", "DAILY_EXCEPT_PUBLIC_HOLIDAYS", 1, 3.0, True, False),
            ]),
            # EcoClean: CS daily except holidays, ACC Mon-Sat, RET Mon-Fri
            (7, [
                ("CS", "DAILY_EXCEPT_PUBLIC_HOLIDAYS", 1, 4.0, False, False),
                ("ACC", "SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF", 1, 2.0, False, False),
                ("RET", "CUSTOM_WEEKDAY_PATTERN", 1, 2.0, False, False, "Monday,Tuesday,Wednesday,Thursday,Friday"),
            ]),
            # LittleSprouts: CS 365 days, NDR daily except holidays, ACC Sundays off
            (8, [
                ("CS", "ALL_DAYS", 1, 4.0, True, True),
                ("NDR", "DAILY_EXCEPT_PUBLIC_HOLIDAYS", 1, 2.0, True, False),
                ("ACC", "SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF", 1, 2.0, False, False),
            ]),
            # PawPals: CS 365 days, ACC daily except holidays
            (9, [
                ("CS", "ALL_DAYS", 1, 5.0, True, True),
                ("ACC", "DAILY_EXCEPT_PUBLIC_HOLIDAYS", 1, 3.0, True, False),
            ]),
            # SoundWave: CS 365 days, NDR daily except holidays, RET Sundays off
            (10, [
                ("CS", "ALL_DAYS", 1, 4.0, True, True),
                ("NDR", "DAILY_EXCEPT_PUBLIC_HOLIDAYS", 1, 2.0, True, False),
                ("RET", "SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF", 1, 2.0, False, False),
            ]),
            # SoleCrafters: CS daily except holidays, ACC Mon-Sat, NDR Mon-Sat
            (11, [
                ("CS", "DAILY_EXCEPT_PUBLIC_HOLIDAYS", 1, 4.0, False, False),
                ("ACC", "SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF", 1, 2.0, False, False),
                ("NDR", "SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF", 1, 2.0, False, False),
            ]),
            # AromaHaven: CS daily except holidays, ACC Mon-Sat
            (12, [
                ("CS", "DAILY_EXCEPT_PUBLIC_HOLIDAYS", 1, 5.0, False, False),
                ("ACC", "SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF", 1, 3.0, False, False),
            ]),
            # RestEasy: CS 365 days, NDR daily except holidays, RET Sundays off
            (13, [
                ("CS", "ALL_DAYS", 1, 4.0, True, True),
                ("NDR", "DAILY_EXCEPT_PUBLIC_HOLIDAYS", 1, 2.0, True, False),
                ("RET", "SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF", 1, 2.0, False, False),
            ]),
            # ZariGems: CS 365 days, ACC daily except holidays, NDR Mon-Sat
            (14, [
                ("CS", "ALL_DAYS", 1, 4.0, True, True),
                ("ACC", "DAILY_EXCEPT_PUBLIC_HOLIDAYS", 1, 2.0, True, False),
                ("NDR", "SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF", 1, 2.0, False, False),
            ]),
            # PureHarvest: CS daily except holidays, ACC Mon-Fri
            (15, [
                ("CS", "DAILY_EXCEPT_PUBLIC_HOLIDAYS", 1, 5.0, False, False),
                ("ACC", "CUSTOM_WEEKDAY_PATTERN", 1, 3.0, False, False, "Monday,Tuesday,Wednesday,Thursday,Friday"),
            ]),

            # 4 Multi-Resource Brands:
            # TitanTech: CS 365 days (min 2 staff), ACC daily except holidays (min 1), NDR daily except holidays (min 1)
            (16, [
                ("CS", "ALL_DAYS", 2, 8.0, True, True),
                ("ACC", "DAILY_EXCEPT_PUBLIC_HOLIDAYS", 1, 8.0, True, False),
                ("NDR", "DAILY_EXCEPT_PUBLIC_HOLIDAYS", 1, 8.0, True, False),
            ]),
            # NutriLife: CS 365 days (min 1), ACC daily except holidays (min 1), RET Mon-Sat (min 1)
            (17, [
                ("CS", "ALL_DAYS", 1, 8.0, True, True),
                ("ACC", "DAILY_EXCEPT_PUBLIC_HOLIDAYS", 1, 8.0, True, False),
                ("RET", "SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF", 1, 8.0, False, False),
            ]),
            # VelvetCouture: CS 365 days (min 1), ACC daily except holidays (min 1), NDR Mon-Sat (min 1)
            (18, [
                ("CS", "ALL_DAYS", 1, 8.0, True, True),
                ("ACC", "DAILY_EXCEPT_PUBLIC_HOLIDAYS", 1, 8.0, True, False),
                ("NDR", "SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF", 1, 8.0, False, False),
            ]),
            # ApexMotor: CS daily except holidays (min 1), NDR daily except holidays (min 1), ACC Mon-Sat (min 1)
            (19, [
                ("CS", "DAILY_EXCEPT_PUBLIC_HOLIDAYS", 1, 8.0, False, False),
                ("NDR", "DAILY_EXCEPT_PUBLIC_HOLIDAYS", 1, 8.0, False, False),
                ("ACC", "SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF", 1, 8.0, False, False),
            ]),
        ]

        total_rules = 0
        for b_idx, rules_list in brand_rules_plan:
            b_id = brands[b_idx].id
            for rule_tuple in rules_list:
                p_code = rule_tuple[0]
                cal_type = rule_tuple[1]
                min_staff = rule_tuple[2]
                hours = rule_tuple[3]
                w_sun = rule_tuple[4]
                w_hol = rule_tuple[5]
                weekdays = rule_tuple[6] if len(rule_tuple) > 6 else None

                r = BrandProcessRule(
                    brand_id=b_id,
                    process_id=processes[p_code].id,
                    operating_calendar_type=cal_type,
                    minimum_staff_required=min_staff,
                    preferred_staff_count=min_staff,
                    workload_hours_per_employee=hours,
                    works_on_sunday=w_sun,
                    works_on_public_holidays=w_hol,
                    operating_weekdays=weekdays,
                    active=True
                )
                db.add(r)
                total_rules += 1
        db.commit()
        print(f"✅ Configured {total_rules} Brand Process Rules across 20 brands")

        # 7. Employee Assignments
        # Single-Resource Brands (Brands 0-15):
        # Dedicated employee (EMP007 to EMP022) handles ALL processes for that brand!
        assignments_count = 0
        for b_idx in range(16):
            emp = employees[6 + b_idx]  # EMP007 is at index 6
            b_id = brands[b_idx].id
            rules_for_brand = brand_rules_plan[b_idx][1]

            # Calculate allocation % per process so total does not exceed 100%
            alloc_pct = round(100.0 / len(rules_for_brand), 1)

            for rule_tuple in rules_for_brand:
                p_code = rule_tuple[0]
                a = EmployeeAssignment(
                    employee_id=emp.id,
                    brand_id=b_id,
                    process_id=processes[p_code].id,
                    assignment_type="PRIMARY",
                    allocation_percentage=alloc_pct,
                    priority=1,
                    is_backup_resource=False,
                    active=True
                )
                db.add(a)
                assignments_count += 1

            # Designate a backup resource from floaters or pod leads
            floater = employees[32 + (b_idx % 6)]  # EMP033 to EMP038
            backup_a = EmployeeAssignment(
                employee_id=floater.id,
                brand_id=b_id,
                process_id=processes["CS"].id,  # Backup for CS
                assignment_type="BACKUP",
                allocation_percentage=100.0,
                priority=2,
                is_backup_resource=True,
                active=True
            )
            db.add(backup_a)
            assignments_count += 1

        # Multi-Resource Brands (Brands 16-19):
        # Brand 16 (TitanTech): EMP023 (CS primary), EMP024 (ACC primary), EMP025 (NDR primary)
        # Shared CS backup: EMP024 can also cross-cover CS
        titan_brand_id = brands[16].id
        emp_23 = employees[22]  # EMP023
        emp_24 = employees[23]  # EMP024
        emp_25 = employees[24]  # EMP025

        # Primary assignments for TitanTech
        for emp, p_code in [(emp_23, "CS"), (emp_24, "ACC"), (emp_25, "NDR")]:
            db.add(EmployeeAssignment(
                employee_id=emp.id, brand_id=titan_brand_id, process_id=processes[p_code].id,
                assignment_type="PRIMARY", allocation_percentage=100.0, priority=1,
                is_backup_resource=False, active=True
            ))
            assignments_count += 1

        # Floater backup for TitanTech CS (TitanTech requires 2 CS staff!)
        floater_titan = employees[32]  # EMP033
        db.add(EmployeeAssignment(
            employee_id=floater_titan.id, brand_id=titan_brand_id, process_id=processes["CS"].id,
            assignment_type="PRIMARY", allocation_percentage=100.0, priority=1,
            is_backup_resource=False, active=True
        ))
        assignments_count += 1

        # Shared cross-cover backup: EMP024 is backup for CS on TitanTech
        db.add(EmployeeAssignment(
            employee_id=emp_24.id, brand_id=titan_brand_id, process_id=processes["CS"].id,
            assignment_type="BACKUP", allocation_percentage=50.0, priority=2,
            is_backup_resource=True, active=True
        ))
        assignments_count += 1

        # Brand 17 (NutriLife): EMP026 (CS), EMP027 (ACC), EMP028 (RET)
        nutri_brand_id = brands[17].id
        emp_26 = employees[25]
        emp_27 = employees[26]
        emp_28 = employees[27]
        for emp, p_code in [(emp_26, "CS"), (emp_27, "ACC"), (emp_28, "RET")]:
            db.add(EmployeeAssignment(
                employee_id=emp.id, brand_id=nutri_brand_id, process_id=processes[p_code].id,
                assignment_type="PRIMARY", allocation_percentage=100.0, priority=1,
                is_backup_resource=False, active=True
            ))
            assignments_count += 1
        # EMP028 is backup for ACC on NutriLife
        db.add(EmployeeAssignment(
            employee_id=emp_28.id, brand_id=nutri_brand_id, process_id=processes["ACC"].id,
            assignment_type="BACKUP", allocation_percentage=50.0, priority=2,
            is_backup_resource=True, active=True
        ))
        assignments_count += 1

        # Brand 18 (VelvetCouture): EMP029 (CS + ACC), EMP030 (NDR)
        velvet_brand_id = brands[18].id
        emp_29 = employees[28]
        emp_30 = employees[29]
        db.add(EmployeeAssignment(
            employee_id=emp_29.id, brand_id=velvet_brand_id, process_id=processes["CS"].id,
            assignment_type="PRIMARY", allocation_percentage=60.0, priority=1,
            is_backup_resource=False, active=True
        ))
        db.add(EmployeeAssignment(
            employee_id=emp_29.id, brand_id=velvet_brand_id, process_id=processes["ACC"].id,
            assignment_type="PRIMARY", allocation_percentage=40.0, priority=1,
            is_backup_resource=False, active=True
        ))
        db.add(EmployeeAssignment(
            employee_id=emp_30.id, brand_id=velvet_brand_id, process_id=processes["NDR"].id,
            assignment_type="PRIMARY", allocation_percentage=100.0, priority=1,
            is_backup_resource=False, active=True
        ))
        assignments_count += 3

        # Brand 19 (ApexMotor): EMP031 (CS + NDR), EMP032 (ACC)
        apex_brand_id = brands[19].id
        emp_31 = employees[30]
        emp_32 = employees[31]
        db.add(EmployeeAssignment(
            employee_id=emp_31.id, brand_id=apex_brand_id, process_id=processes["CS"].id,
            assignment_type="PRIMARY", allocation_percentage=50.0, priority=1,
            is_backup_resource=False, active=True
        ))
        db.add(EmployeeAssignment(
            employee_id=emp_31.id, brand_id=apex_brand_id, process_id=processes["NDR"].id,
            assignment_type="PRIMARY", allocation_percentage=50.0, priority=1,
            is_backup_resource=False, active=True
        ))
        db.add(EmployeeAssignment(
            employee_id=emp_32.id, brand_id=apex_brand_id, process_id=processes["ACC"].id,
            assignment_type="PRIMARY", allocation_percentage=100.0, priority=1,
            is_backup_resource=False, active=True
        ))
        assignments_count += 3

        db.commit()
        print(f"✅ Created {assignments_count} Employee Assignments (Single, Multi, Shared & Backup)")

        # 8. Create Weekly Off Rules for ALL 38 Employees
        # Realistic off-day distribution
        off_count = 0
        for emp in employees:
            pref = emp.preferred_weekly_off_days or "Sunday"
            for off_day in pref.split(","):
                w = WeeklyOffRule(
                    employee_id=emp.id,
                    off_day=off_day.strip(),
                    rule_type="FIXED",
                    active=True
                )
                db.add(w)
                off_count += 1
        db.commit()
        print(f"✅ Created {off_count} Weekly Off Rules")

        # 9. Create Public Holidays for Current / Upcoming Period (2026/2025/2024)
        # We seed dates for 2026 as well as 2025/current year so any monthly roster query works!
        holidays_template = [
            ("New Year's Day", 1, 1),
            ("Republic Day", 1, 26),
            ("Holi", 3, 14),
            ("Eid-ul-Fitr", 3, 31),
            ("Good Friday", 4, 3),
            ("May Day / Maharashtra Day", 5, 1),
            ("Independence Day", 8, 15),
            ("Gandhi Jayanti", 10, 2),
            ("Dussehra", 10, 20),
            ("Diwali (Deepavali)", 11, 8),
            ("Guru Nanak Jayanti", 11, 24),
            ("Christmas Day", 12, 25),
        ]

        total_holidays = 0
        # Add for both 2026 and 2025 to cover current year
        for yr in [2025, 2026]:
            for name, m, d in holidays_template:
                ph = PublicHoliday(
                    holiday_name=f"{name} ({yr})",
                    holiday_date=date(yr, m, d),
                    region="PAN-INDIA",
                    description="Gazetted public holiday",
                    applicable_to_all=True
                )
                db.add(ph)
                total_holidays += 1
        db.commit()
        print(f"✅ Created {total_holidays} Public Holidays")

        # 10. Sample Leaves (Approved, Pending, Comp-Offs)
        # Year 2026 & 2025
        for yr in [2026]:
            # Approved Planned Leave: Aditya Joshi (EMP007, dedicated to GlowAura) has planned leave Nov 12-14, 2026
            db.add(LeaveRequest(
                employee_id=employees[6].id,
                leave_type="PLANNED_LEAVE",
                start_date=date(yr, 11, 12),
                end_date=date(yr, 11, 14),
                status="APPROVED",
                reason="Family wedding in Jaipur",
                approved_by=employees[0].id
            ))

            # Approved Sick Leave: Priya Nair (Pod Lead)
            db.add(LeaveRequest(
                employee_id=employees[1].id,
                leave_type="SICK_LEAVE",
                start_date=date(yr, 11, 5),
                end_date=date(yr, 11, 6),
                status="APPROVED",
                reason="Viral fever recovery",
                approved_by=employees[0].id
            ))

            # Pending Leave Request: Tanvi Rao (EMP010) - PENDING must NOT block scheduling!
            db.add(LeaveRequest(
                employee_id=employees[9].id,
                leave_type="PLANNED_LEAVE",
                start_date=date(yr, 11, 18),
                end_date=date(yr, 11, 20),
                status="PENDING",
                reason="Personal travel to Bangalore"
            ))

            # Approved Comp-Off: Gaurav Pandey (EMP023 - TitanTech CS)
            db.add(LeaveRequest(
                employee_id=employees[22].id,
                leave_type="COMP_OFF",
                start_date=date(yr, 11, 10),
                end_date=date(yr, 11, 10),
                status="APPROVED",
                reason="Worked extra weekend support hours for big festive sale",
                approved_by=employees[2].id
            ))

            # Explicit Unavailability: Ishaan Kapoor (EMP011) unavailable Nov 25
            db.add(EmployeeAvailability(
                employee_id=employees[10].id,
                availability_date=date(yr, 11, 25),
                availability_status="UNAVAILABLE",
                reason="Emergency medical procedure",
                notes="Consulted with pod lead"
            ))

        db.commit()
        print("✅ Created Sample Leaves & Availability Records (Approved, Pending, Comp-Off, Unavailable)")

        print("✨ Database Seeding Completed Successfully!")
        return True

    except Exception as e:
        db.rollback()
        print(f"❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = seed()
    sys.exit(0 if success else 1)
