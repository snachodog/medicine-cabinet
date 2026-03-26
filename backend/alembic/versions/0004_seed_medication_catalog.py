"""Seed medication_catalog with common OTC, supplement, and Rx entries

Revision ID: 0004
Revises: 0003
Create Date: 2026-03-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

catalog = sa.table(
    "medication_catalog",
    sa.column("name", sa.String),
    sa.column("type", sa.String),
    sa.column("default_dose_amount", sa.String),
    sa.column("notes", sa.Text),
)

ENTRIES = [
    # ── OTC Pain / Fever ──────────────────────────────────────────────────────
    ("Acetaminophen (Tylenol)",          "otc",        "500mg",  None),
    ("Ibuprofen (Advil / Motrin)",       "otc",        "200mg",  None),
    ("Aspirin",                          "otc",        "325mg",  None),
    ("Naproxen Sodium (Aleve)",          "otc",        "220mg",  None),

    # ── OTC Antihistamines ────────────────────────────────────────────────────
    ("Cetirizine (Zyrtec)",              "otc",        "10mg",   None),
    ("Loratadine (Claritin)",            "otc",        "10mg",   None),
    ("Fexofenadine (Allegra)",           "otc",        "180mg",  None),
    ("Diphenhydramine (Benadryl)",       "otc",        "25mg",   None),

    # ── OTC Decongestants / Cough / Cold ─────────────────────────────────────
    ("Pseudoephedrine (Sudafed)",        "otc",        "30mg",   None),
    ("Phenylephrine",                    "otc",        "10mg",   None),
    ("Guaifenesin (Mucinex)",            "otc",        "600mg",  None),
    ("Dextromethorphan",                 "otc",        "15mg",   None),

    # ── OTC GI ───────────────────────────────────────────────────────────────
    ("Calcium Carbonate (Tums)",         "otc",        "500mg",  None),
    ("Famotidine (Pepcid)",              "otc",        "20mg",   None),
    ("Omeprazole (Prilosec OTC)",        "otc",        "20mg",   None),
    ("Bismuth Subsalicylate (Pepto-Bismol)", "otc",   "262mg",  None),
    ("Loperamide (Imodium)",             "otc",        "2mg",    None),
    ("Docusate Sodium (Colace)",         "otc",        "100mg",  None),
    ("Polyethylene Glycol (MiraLax)",    "otc",        "17g",    None),
    ("Simethicone (Gas-X)",              "otc",        "125mg",  None),

    # ── OTC Sleep ─────────────────────────────────────────────────────────────
    ("Melatonin",                        "supplement", "5mg",    None),
    ("Doxylamine (Unisom)",              "otc",        "25mg",   None),

    # ── OTC Topical ──────────────────────────────────────────────────────────
    ("Hydrocortisone Cream 1%",          "otc",        "1%",     None),
    ("Bacitracin / Neosporin",           "otc",        None,     None),
    ("Clotrimazole (Lotrimin)",          "otc",        "1%",     None),

    # ── Vitamins & Supplements ────────────────────────────────────────────────
    ("Multivitamin",                     "supplement", None,     None),
    ("Vitamin D3",                       "supplement", "2000 IU", None),
    ("Vitamin C",                        "supplement", "500mg",  None),
    ("Vitamin B12 (sublingual)",         "supplement", "1000mcg", None),
    ("Vitamin B6",                       "supplement", "50mg",   None),
    ("B-Complex",                        "supplement", None,     None),
    ("Folic Acid",                       "supplement", "400mcg", None),
    ("Calcium",                          "supplement", "600mg",  None),
    ("Magnesium Glycinate",              "supplement", "400mg",  None),
    ("Zinc",                             "supplement", "25mg",   None),
    ("Iron (Ferrous Sulfate)",           "supplement", "65mg",   None),
    ("Omega-3 / Fish Oil",               "supplement", "1000mg", None),
    ("Biotin",                           "supplement", "5000mcg", None),
    ("Probiotics",                       "supplement", None,     None),
    ("CoQ10",                            "supplement", "100mg",  None),
    ("Turmeric / Curcumin",              "supplement", "500mg",  None),

    # ── Prescription (common Rx) ─────────────────────────────────────────────
    ("Amoxicillin",                      "rx",         "500mg",  None),
    ("Azithromycin (Z-Pack)",            "rx",         "250mg",  None),
    ("Prednisone",                       "rx",         "10mg",   None),
    ("Levothyroxine (Synthroid)",        "rx",         "50mcg",  None),
    ("Lisinopril",                       "rx",         "10mg",   None),
    ("Metformin",                        "rx",         "500mg",  None),
    ("Atorvastatin (Lipitor)",           "rx",         "20mg",   None),
    ("Metoprolol Succinate",             "rx",         "25mg",   None),
    ("Amlodipine",                       "rx",         "5mg",    None),
    ("Sertraline (Zoloft)",              "rx",         "50mg",   None),
    ("Escitalopram (Lexapro)",           "rx",         "10mg",   None),
    ("Fluoxetine (Prozac)",              "rx",         "20mg",   None),
    ("Bupropion (Wellbutrin)",           "rx",         "150mg",  None),
    ("Gabapentin",                       "rx",         "300mg",  None),
    ("Montelukast (Singulair)",          "rx",         "10mg",   None),
    ("Omeprazole (Rx)",                  "rx",         "40mg",   None),
    ("Losartan",                         "rx",         "50mg",   None),

    # ── Schedule II Controlled ────────────────────────────────────────────────
    ("Lisdexamfetamine (Vyvanse)",       "schedule_ii", "30mg",  "Schedule II — new written Rx required each fill"),
    ("Amphetamine Salts (Adderall)",     "schedule_ii", "10mg",  "Schedule II — new written Rx required each fill"),
    ("Methylphenidate (Ritalin)",        "schedule_ii", "10mg",  "Schedule II — new written Rx required each fill"),
    ("Dextroamphetamine (Dexedrine)",    "schedule_ii", "5mg",   "Schedule II — new written Rx required each fill"),
    ("Oxycodone",                        "schedule_ii", "5mg",   "Schedule II — new written Rx required each fill"),
    ("Hydrocodone",                      "schedule_ii", "5mg",   "Schedule II — new written Rx required each fill"),
]


def upgrade() -> None:
    op.bulk_insert(
        catalog,
        [
            {"name": name, "type": type_, "default_dose_amount": dose, "notes": notes}
            for name, type_, dose, notes in ENTRIES
        ],
    )


def downgrade() -> None:
    op.execute("DELETE FROM medication_catalog")
