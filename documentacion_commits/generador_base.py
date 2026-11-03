#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generador_documentacion_docx.py
Genera un documento técnico en formato .docx por cada commit del proyecto Playa Alerta.
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

OUTPUT_DIR = r"c:\Users\ewara\OneDrive\Escritorio\capetero carpetin\playa-alerta-vs\documentacion_commits"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Paleta Institucional Playa Alerta
COLOR_NAVY_HEX = "003366"
COLOR_NAVY = RGBColor(0, 51, 102)
COLOR_AMBER_HEX = "E59837"
COLOR_AMBER = RGBColor(229, 152, 55)
COLOR_DARK_HEX = "1E293B"
COLOR_DARK = RGBColor(30, 41, 59)
COLOR_MUTED_HEX = "64748B"
COLOR_MUTED = RGBColor(100, 116, 139)
COLOR_LIGHT_BG_HEX = "F8FAFC"
COLOR_BORDER_HEX = "CBD5E1"
COLOR_GREEN_HEX = "16A34A"
COLOR_GREEN = RGBColor(22, 163, 74)

def set_cell_shading(cell, color_hex):
    """Aplica color de fondo a una celda."""
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Ajusta padding interno de una celda."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="CBD5E1", sz="4", val="single"):
    """Aplica bordes suaves a la tabla."""
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideV w:val="none"/>
            <w:left w:val="none"/>
            <w:right w:val="none"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)

def add_header_banner(doc, title_text, subtitle_text):
    """Encabezado superior del documento con estilo institucional."""
    # Tabla banner de 1 celda
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_shading(cell, COLOR_NAVY_HEX)
    set_cell_margins(cell, top=200, bottom=200, left=250, right=250)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    run_brand = p.add_run("PLAYA ALERTA  |  REPORTE TÉCNICO DE CAMBIO")
    run_brand.font.name = 'Segoe UI'
    run_brand.font.size = Pt(9.5)
    run_brand.font.bold = True
    run_brand.font.color.rgb = COLOR_AMBER
    
    p2 = cell.add_paragraph()
    p2.paragraph_format.space_before = Pt(2)
    p2.paragraph_format.space_after = Pt(4)
    run_title = p2.add_run(title_text)
    run_title.font.name = 'Segoe UI'
    run_title.font.size = Pt(16)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(255, 255, 255)
    
    p3 = cell.add_paragraph()
    p3.paragraph_format.space_before = Pt(0)
    p3.paragraph_format.space_after = Pt(0)
    run_sub = p3.add_run(subtitle_text)
    run_sub.font.name = 'Segoe UI'
    run_sub.font.size = Pt(10)
    run_sub.font.color.rgb = RGBColor(226, 232, 240)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def add_metadata_table(doc, meta_dict):
    """Genera la tabla con los metadatos del commit."""
    tbl = doc.add_table(rows=len(meta_dict), cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    set_table_borders(tbl, color="E2E8F0")
    
    col_widths = [Inches(1.8), Inches(4.7)]
    for i, (k, v) in enumerate(meta_dict.items()):
        row = tbl.rows[i]
        
        c0 = row.cells[0]
        c0.width = col_widths[0]
        set_cell_margins(c0, top=60, bottom=60, left=100, right=100)
        set_cell_shading(c0, "F1F5F9")
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_after = Pt(0)
        r0 = p0.add_run(k)
        r0.font.name = 'Segoe UI'
        r0.font.size = Pt(9.5)
        r0.font.bold = True
        r0.font.color.rgb = COLOR_DARK
        
        c1 = row.cells[1]
        c1.width = col_widths[1]
        set_cell_margins(c1, top=60, bottom=60, left=100, right=100)
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(0)
        r1 = p1.add_run(v)
        r1.font.name = 'Segoe UI'
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = COLOR_DARK
        if k in ("Commit Hash", "Rama"):
            r1.font.name = 'Consolas'
            r1.font.bold = True
            
    doc.add_paragraph().paragraph_format.space_after = Pt(8)

def add_section_heading(doc, text):
    """Encabezado de sección con estilo corporativo."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(text)
    r.font.name = 'Segoe UI'
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = COLOR_NAVY
    
    # Línea inferior decorativa
    p_line = doc.add_paragraph()
    p_line.paragraph_format.space_before = Pt(0)
    p_line.paragraph_format.space_after = Pt(8)
    r_line = p_line.add_run("―" * 45)
    r_line.font.name = 'Segoe UI'
    r_line.font.size = Pt(8)
    r_line.font.color.rgb = COLOR_AMBER

def add_paragraph_styled(doc, text, bold_prefix=None):
    """Párrafo estándar con formato limpio."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix + " ")
        r_pre.font.name = 'Segoe UI'
        r_pre.font.size = Pt(10)
        r_pre.font.bold = True
        r_pre.font.color.rgb = COLOR_DARK
    r = p.add_run(text)
    r.font.name = 'Segoe UI'
    r.font.size = Pt(10)
    r.font.color.rgb = COLOR_DARK
    return p

def add_bullet_styled(doc, text, bold_prefix=None):
    """Elemento de lista con viñeta."""
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix + " ")
        r_pre.font.name = 'Segoe UI'
        r_pre.font.size = Pt(10)
        r_pre.font.bold = True
        r_pre.font.color.rgb = COLOR_DARK
    r = p.add_run(text)
    r.font.name = 'Segoe UI'
    r.font.size = Pt(10)
    r.font.color.rgb = COLOR_DARK
    return p

def add_callout(doc, text, title="NOTA TÉCNICA"):
    """Caja destacada con borde y fondo suave."""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_shading(cell, "F8FAFC")
    set_cell_margins(cell, top=100, bottom=100, left=160, right=160)
    
    # Borde izquierdo grueso
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:left w:val="single" w:sz="24" w:space="0" w:color="{COLOR_NAVY_HEX}"/>
            <w:top w:val="none"/>
            <w:right w:val="none"/>
            <w:bottom w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    r_title = p.add_run(f"📌 {title}: ")
    r_title.font.name = 'Segoe UI'
    r_title.font.size = Pt(9.5)
    r_title.font.bold = True
    r_title.font.color.rgb = COLOR_NAVY
    
    r_txt = p.add_run(text)
    r_txt.font.name = 'Segoe UI'
    r_txt.font.size = Pt(9.5)
    r_txt.font.color.rgb = COLOR_DARK
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def add_files_table(doc, files_list):
    """Crea una tabla elegante con los archivos afectados."""
    tbl = doc.add_table(rows=len(files_list) + 1, cols=4)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    set_table_borders(tbl, color="CBD5E1")
    
    widths = [Inches(2.2), Inches(1.1), Inches(1.0), Inches(2.2)]
    headers = ["Archivo / Ruta", "Operación", "Impacto", "Descripción del Cambio"]
    
    # Fila de encabezado
    hdr_row = tbl.rows[0]
    for idx, name in enumerate(headers):
        c = hdr_row.cells[idx]
        c.width = widths[idx]
        set_cell_shading(c, COLOR_NAVY_HEX)
        set_cell_margins(c, top=80, bottom=80, left=100, right=100)
        p = c.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(name)
        r.font.name = 'Segoe UI'
        r.font.size = Pt(9)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    for i, item in enumerate(files_list):
        row = tbl.rows[i + 1]
        bg = "FFFFFF" if i % 2 == 0 else "F8FAFC"
        
        for c_idx, val in enumerate(item):
            c = row.cells[c_idx]
            c.width = widths[c_idx]
            set_cell_shading(c, bg)
            set_cell_margins(c, top=60, bottom=60, left=100, right=100)
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(val)
            r.font.name = 'Segoe UI'
            r.font.size = Pt(8.5)
            r.font.color.rgb = COLOR_DARK
            if c_idx == 0:
                r.font.name = 'Consolas'
                r.font.bold = True
            elif c_idx == 1:
                r.font.bold = True
                if "Creación" in val or "Nuevo" in val:
                    r.font.color.rgb = COLOR_GREEN
                elif "Modificado" in val:
                    r.font.color.rgb = COLOR_AMBER

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def create_base_doc():
    """Configura márgenes y tipografía base del documento."""
    doc = docx.Document()
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)
    return doc

print("Módulo base de generación DOCX preparado.")
