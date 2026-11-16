"""Calendar rules engine for determining operational days."""
from datetime import date, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session


WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def get_weekday_name(d: date) -> str:
    """Return the weekday name for a given date."""
    return WEEKDAY_NAMES[d.weekday()]


def is_sunday(d: date) -> bool:
    return d.weekday() == 6


def is_public_holiday(d: date, holidays: List[date]) -> bool:
    return d in holidays


def get_holidays_for_brand(db: Session, brand_id: int, month: int, year: int) -> List[date]:
    """Get applicable public holidays for a brand in a given month."""
    from app.models.models import PublicHoliday, PublicHolidayBrandException
    from datetime import date as date_type
    import calendar

    _, last_day = calendar.monthrange(year, month)
    start_date = date_type(year, month, 1)
    end_date = date_type(year, month, last_day)

    # Get all holidays in the month
    holidays = db.query(PublicHoliday).filter(
        PublicHoliday.holiday_date >= start_date,
        PublicHoliday.holiday_date <= end_date
    ).all()

    applicable_holidays = []
    for holiday in holidays:
        if holiday.applicable_to_all:
            # Check if there's a brand exception making it NOT applicable
            exception = db.query(PublicHolidayBrandException).filter(
                PublicHolidayBrandException.holiday_id == holiday.id,
                PublicHolidayBrandException.brand_id == brand_id,
                PublicHolidayBrandException.is_applicable == False
            ).first()
            if not exception:
                applicable_holidays.append(holiday.holiday_date)
        else:
            # Check if there's a brand exception making it applicable
            exception = db.query(PublicHolidayBrandException).filter(
                PublicHolidayBrandException.holiday_id == holiday.id,
                PublicHolidayBrandException.brand_id == brand_id,
                PublicHolidayBrandException.is_applicable == True
            ).first()
            if exception:
                applicable_holidays.append(holiday.holiday_date)

    return applicable_holidays


def is_process_operational(
    calendar_type: str,
    d: date,
    holidays: List[date],
    operating_weekdays: Optional[str] = None,
    works_on_sunday: bool = False,
    works_on_public_holidays: bool = False
) -> bool:
    """
    Determine if a process requires staffing on a given date.
    This is THE critical function - each process has independent calendar logic.
    """
    weekday_name = get_weekday_name(d)
    is_holiday = d in holidays

    if calendar_type == "ALL_DAYS":
        # 365-day operation - works every day including holidays and Sundays
        return True

    elif calendar_type == "DAILY_EXCEPT_PUBLIC_HOLIDAYS":
        # Works all days except public holidays
        if is_holiday and not works_on_public_holidays:
            return False
        return True

    elif calendar_type == "SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF":
        # Monday-Saturday, excluding public holidays
        if is_sunday(d) and not works_on_sunday:
            return False
        if is_holiday and not works_on_public_holidays:
            return False
        return True

    elif calendar_type == "CUSTOM_WEEKDAY_PATTERN":
        # Only operates on configured weekdays
        if operating_weekdays:
            allowed_days = [day.strip() for day in operating_weekdays.split(",")]
            if weekday_name not in allowed_days:
                return False
        if is_holiday and not works_on_public_holidays:
            return False
        if is_sunday(d) and not works_on_sunday:
            return False
        return True

    # Default: operational
    return True


def get_month_dates(month: int, year: int) -> List[date]:
    """Get all dates in a given month."""
    import calendar
    _, last_day = calendar.monthrange(year, month)
    return [date(year, month, day) for day in range(1, last_day + 1)]
