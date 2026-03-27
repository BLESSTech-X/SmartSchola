from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import grading as g

NAVY = colors.HexColor("#0B1D3A")
GOLD = colors.HexColor("#F5A623")
LIGHT_BLUE = colors.HexColor("#EBF4FF")
LIGHT_GREY = colors.HexColor("#F8F8F8")
WHITE = colors.white


def generate_student_report(student, marks, school, position_data: dict) -> BytesIO:
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    styles = getSampleStyleSheet()
    story = []

    # ── Header banner ────────────────────────────────────────────────────────
    school_name = school.name if school else "Smart Schola"
    school_addr = school.address or ""
    headmaster = school.headmaster or ""
    school_phone = school.phone or ""

    header_data = [
        [Paragraph(
            f'<font color="white" size="18"><b>{school_name}</b></font>',
            ParagraphStyle("H", fontName="Helvetica-Bold", alignment=TA_CENTER)
        )],
        [Paragraph(
            f'<font color="#F5A623" size="9">{school_addr}  |  Headmaster: {headmaster}  |  {school_phone}</font>',
            ParagraphStyle("Sub", fontName="Helvetica", alignment=TA_CENTER)
        )],
    ]
    header_table = Table(header_data, colWidths=[180 * mm])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=3, color=GOLD, spaceAfter=8))

    # ── Title ─────────────────────────────────────────────────────────────────
    title_style = ParagraphStyle(
        "Title",
        fontName="Helvetica-Bold",
        fontSize=13,
        alignment=TA_CENTER,
        textColor=NAVY,
        spaceAfter=8,
    )
    story.append(Paragraph("STUDENT ACADEMIC REPORT SLIP", title_style))

    # ── Student info grid ─────────────────────────────────────────────────────
    label_style = ParagraphStyle("LBL", fontName="Helvetica-Bold", fontSize=9, textColor=NAVY)
    value_style = ParagraphStyle("VAL", fontName="Helvetica", fontSize=9)

    full_name = f"{student.first_name} {student.last_name}"
    info_rows = [
        ["Full Name:", full_name, "Grade:", str(student.grade)],
        ["Class:", student.class_name, "Gender:", student.gender or "—"],
        ["Term:", str(marks[0].term) if marks else "—", "Year:", str(marks[0].year) if marks else "—"],
    ]

    info_table_data = []
    for row in info_rows:
        info_table_data.append([
            Paragraph(row[0], label_style),
            Paragraph(row[1], value_style),
            Paragraph(row[2], label_style),
            Paragraph(row[3], value_style),
        ])

    info_table = Table(info_table_data, colWidths=[30 * mm, 60 * mm, 30 * mm, 60 * mm])
    info_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GREY),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 8))

    # ── Marks table ───────────────────────────────────────────────────────────
    marks_header = [
        Paragraph('<font color="white"><b>Subject</b></font>', ParagraphStyle("MH", fontName="Helvetica-Bold", fontSize=9, alignment=TA_LEFT)),
        Paragraph('<font color="white"><b>Score</b></font>', ParagraphStyle("MH", fontName="Helvetica-Bold", fontSize=9, alignment=TA_CENTER)),
        Paragraph('<font color="white"><b>ECZ Grade</b></font>', ParagraphStyle("MH", fontName="Helvetica-Bold", fontSize=9, alignment=TA_CENTER)),
        Paragraph('<font color="white"><b>Remark</b></font>', ParagraphStyle("MH", fontName="Helvetica-Bold", fontSize=9, alignment=TA_LEFT)),
    ]

    marks_data = [marks_header]
    for i, mark in enumerate(marks):
        subject_name = mark.subject.name if mark.subject else "Unknown"
        bg = WHITE if i % 2 == 0 else LIGHT_GREY
        marks_data.append([
            Paragraph(subject_name, ParagraphStyle("MD", fontName="Helvetica", fontSize=8)),
            Paragraph(str(mark.score), ParagraphStyle("MC", fontName="Helvetica-Bold", fontSize=8, alignment=TA_CENTER)),
            Paragraph(str(mark.ecz_grade or ""), ParagraphStyle("MC", fontName="Helvetica-Bold", fontSize=8, alignment=TA_CENTER)),
            Paragraph(mark.ai_remark or "", ParagraphStyle("MD", fontName="Helvetica", fontSize=7)),
        ])

    marks_table = Table(marks_data, colWidths=[45 * mm, 20 * mm, 25 * mm, 90 * mm])
    
    marks_style = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GREY]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]
    marks_table.setStyle(TableStyle(marks_style))
    story.append(marks_table)
    story.append(Spacer(1, 8))

    # ── Summary box ───────────────────────────────────────────────────────────
    total_score = sum(m.score for m in marks)
    ecz_grades = [m.ecz_grade for m in marks if m.ecz_grade]
    div = g.division(ecz_grades) if ecz_grades else "N/A"
    pos = position_data.get("position", "—")
    out_of = position_data.get("out_of", "—")

    summary_style = ParagraphStyle("SUM", fontName="Helvetica-Bold", fontSize=10, textColor=NAVY, alignment=TA_CENTER)
    summary_label = ParagraphStyle("SL", fontName="Helvetica", fontSize=8, textColor=colors.grey, alignment=TA_CENTER)

    summary_data = [[
        Paragraph(f'<b>{total_score}</b><br/><font size="7" color="grey">Total Marks</font>', summary_style),
        Paragraph(f'<b>{div}</b><br/><font size="7" color="grey">Division</font>', summary_style),
        Paragraph(f'<b>{pos} / {out_of}</b><br/><font size="7" color="grey">Class Position</font>', summary_style),
        Paragraph(f'<b>{len(marks)}</b><br/><font size="7" color="grey">Subjects Sat</font>', summary_style),
    ]]

    summary_table = Table(summary_data, colWidths=[45 * mm] * 4)
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BLUE),
        ("BOX", (0, 0), (-1, -1), 2, GOLD),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 10))

    # ── Remarks section ───────────────────────────────────────────────────────
    remark_style = ParagraphStyle("RMK", fontName="Helvetica-Bold", fontSize=9, textColor=NAVY)
    story.append(Paragraph("Class Teacher's Remarks:", remark_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey, spaceAfter=10))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Headmaster's Remarks:", remark_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey, spaceAfter=10))
    story.append(Spacer(1, 6))

    # ── Signature line ────────────────────────────────────────────────────────
    sig_data = [["Headmaster's Signature: ___________________________", "Date: ____________", "Stamp:"]]
    sig_table = Table(sig_data, colWidths=[90 * mm, 50 * mm, 40 * mm])
    sig_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(sig_table)

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=2, color=GOLD, spaceBefore=4))
    footer_style = ParagraphStyle("FTR", fontName="Helvetica-Oblique", fontSize=7, alignment=TA_CENTER, textColor=colors.grey)
    story.append(Paragraph("Smart Schola — Empowering Zambian Schools Through Technology", footer_style))

    doc.build(story)
    buf.seek(0)
    return buf


def generate_class_report(students_data: list, class_name: str, term: int, year: int, school) -> BytesIO:
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, rightMargin=15 * mm, leftMargin=15 * mm, topMargin=15 * mm, bottomMargin=15 * mm)

    school_name = school.name if school else "Smart Schola"
    styles = getSampleStyleSheet()
    story = []

    # Header
    header_data = [[Paragraph(
        f'<font color="white" size="16"><b>{school_name}</b></font>',
        ParagraphStyle("H", fontName="Helvetica-Bold", alignment=TA_CENTER)
    )]]
    header_table = Table(header_data, colWidths=[180 * mm])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=3, color=GOLD, spaceAfter=8))

    title_style = ParagraphStyle("Title", fontName="Helvetica-Bold", fontSize=12, alignment=TA_CENTER, textColor=NAVY, spaceAfter=6)
    story.append(Paragraph(f"CLASS RESULTS SUMMARY — {class_name} | Term {term}, {year}", title_style))

    # Table header
    table_data = [[
        Paragraph('<font color="white"><b>#</b></font>', ParagraphStyle("H", fontName="Helvetica-Bold", fontSize=9, alignment=TA_CENTER)),
        Paragraph('<font color="white"><b>Student Name</b></font>', ParagraphStyle("H", fontName="Helvetica-Bold", fontSize=9)),
        Paragraph('<font color="white"><b>Grade</b></font>', ParagraphStyle("H", fontName="Helvetica-Bold", fontSize=9, alignment=TA_CENTER)),
        Paragraph('<font color="white"><b>Total Score</b></font>', ParagraphStyle("H", fontName="Helvetica-Bold", fontSize=9, alignment=TA_CENTER)),
        Paragraph('<font color="white"><b>Division</b></font>', ParagraphStyle("H", fontName="Helvetica-Bold", fontSize=9, alignment=TA_CENTER)),
        Paragraph('<font color="white"><b>Position</b></font>', ParagraphStyle("H", fontName="Helvetica-Bold", fontSize=9, alignment=TA_CENTER)),
    ]]

    for i, row in enumerate(students_data):
        bg = WHITE if i % 2 == 0 else LIGHT_GREY
        table_data.append([
            Paragraph(str(i + 1), ParagraphStyle("D", fontName="Helvetica", fontSize=8, alignment=TA_CENTER)),
            Paragraph(row["name"], ParagraphStyle("D", fontName="Helvetica", fontSize=8)),
            Paragraph(str(row["grade"]), ParagraphStyle("D", fontName="Helvetica", fontSize=8, alignment=TA_CENTER)),
            Paragraph(str(row["total"]), ParagraphStyle("D", fontName="Helvetica-Bold", fontSize=8, alignment=TA_CENTER)),
            Paragraph(row["division"], ParagraphStyle("D", fontName="Helvetica", fontSize=8, alignment=TA_CENTER)),
            Paragraph(str(row["position"]), ParagraphStyle("D", fontName="Helvetica", fontSize=8, alignment=TA_CENTER)),
        ])

    t = Table(table_data, colWidths=[10 * mm, 65 * mm, 20 * mm, 30 * mm, 30 * mm, 25 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GREY]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=2, color=GOLD))
    story.append(Paragraph("Smart Schola — Empowering Zambian Schools Through Technology",
                            ParagraphStyle("FTR", fontName="Helvetica-Oblique", fontSize=7, alignment=TA_CENTER, textColor=colors.grey)))

    doc.build(story)
    buf.seek(0)
    return buf
