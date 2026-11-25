# -*- coding: utf-8 -*-
"""Assembler for the 1000-question German Gymnasium exam bank.

Each question is a dict with the full field set. We collect them in Q and
dump to questions_gymnasium.json as a UTF-8, pretty-printed, parseable JSON file.
"""
import json
import sys

Q = []

def add(subject, topic, difficulty, question, options, correct, explanation,
        more_info, reference, example, open_question):
    assert correct in options, f"correct key {correct} not in options for: {question}"
    Q.append({
        "id": len(Q) + 1,
        "subject": subject,
        "topic": topic,
        "difficulty": difficulty,
        "question": question,
        "options": options,
        "correct": correct,
        "explanation": explanation,
        "more_info": more_info,
        "reference": reference,
        "example": example,
        "open_question": open_question,
    })

# ---------------- MATHEMATIK ----------------
add("Mathematik", "Analysis – Ableitung", "mittel",
    "Was ist die erste Ableitung von f(x) = x³ − 4x² + 7x − 2?",
    {"A": "3x² − 8x + 7", "B": "3x² − 4x + 7", "C": "x² − 8x + 7", "D": "3x³ − 8x² + 7"},
    "A",
    "Nach der Potenzregel wird jeder Term x^n zu n·x^(n−1) abgeleitet. Die Konstante −2 fällt weg.",
    "Die Potenzregel lautet (x^n)' = n·x^(n−1). Sie ist die Grundlage der Differentialrechnung.",
    "Lambacher Schweizer, Analysis Oberstufe; Kapitel Ableitungsregeln.",
    "Die Steigung von f an der Stelle x=1 ist f'(1) = 3−8+7 = 2.",
    "Erkläre, warum die Ableitung einer konstanten Funktion stets null ist.")

add("Mathematik", "Analysis – Integral", "mittel",
    "Welchen Wert hat das bestimmte Integral ∫ von 0 bis 2 über 3x² dx?",
    {"A": "6", "B": "8", "C": "12", "D": "4"},
    "B",
    "Eine Stammfunktion von 3x² ist x³. Eingesetzt: 2³ − 0³ = 8.",
    "Der Hauptsatz der Differential- und Integralrechnung verbindet Ableitung und Integral.",
    "Lambacher Schweizer, Integralrechnung.",
    "Das Integral gibt hier den Flächeninhalt unter der Parabel zwischen 0 und 2 an.",
    "Was bedeutet ein negatives bestimmtes Integral geometrisch?")

add("Mathematik", "Algebra – Quadratische Gleichung", "leicht",
    "Welche Lösungen hat x² − 5x + 6 = 0?",
    {"A": "x=1 und x=6", "B": "x=2 und x=3", "C": "x=−2 und x=−3", "D": "x=5 und x=6"},
    "B",
    "Nach dem Satz von Vieta gilt: Produkt der Lösungen = 6, Summe = 5. Das trifft auf 2 und 3 zu.",
    "Die pq-Formel lautet x = −p/2 ± √((p/2)² − q).",
    "Bildungsplan Mathematik Sekundarstufe I/II.",
    "Faktorisiert: (x−2)(x−3)=0, also x=2 oder x=3.",
    "Wann hat eine quadratische Gleichung keine reelle Lösung?")

add("Mathematik", "Geometrie – Satz des Pythagoras", "leicht",
    "Ein rechtwinkliges Dreieck hat die Katheten 3 cm und 4 cm. Wie lang ist die Hypotenuse?",
    {"A": "5 cm", "B": "6 cm", "C": "7 cm", "D": "√7 cm"},
    "A",
    "Nach Pythagoras gilt c² = a² + b² = 9 + 16 = 25, also c = 5.",
    "Der Satz gilt nur in rechtwinkligen Dreiecken; die Hypotenuse liegt dem rechten Winkel gegenüber.",
    "Euklid, Elemente, Buch I, Satz 47.",
    "Das 3-4-5-Dreieck ist das bekannteste pythagoreische Zahlentripel.",
    "Nenne ein weiteres pythagoreisches Zahlentripel und begründe es.")

add("Mathematik", "Stochastik – Wahrscheinlichkeit", "mittel",
    "Ein fairer Würfel wird einmal geworfen. Wie groß ist die Wahrscheinlichkeit für eine gerade Zahl?",
    {"A": "1/6", "B": "1/3", "C": "1/2", "D": "2/3"},
    "C",
    "Gerade Zahlen sind 2, 4, 6 – also 3 von 6 gleich wahrscheinlichen Ergebnissen: 3/6 = 1/2.",
    "Bei Laplace-Experimenten gilt P = Anzahl günstiger / Anzahl möglicher Ergebnisse.",
    "Bildungsplan Stochastik, Sekundarstufe I.",
    "P(gerade) = |{2,4,6}| / |{1,2,3,4,5,6}| = 1/2.",
    "Wie ändert sich die Wahrscheinlichkeit bei zwei Würfeln für eine gerade Summe?")

add("Mathematik", "Analysis – Grenzwert", "schwer",
    "Welchen Grenzwert hat (sin x)/x für x gegen 0?",
    {"A": "0", "B": "1", "C": "unendlich", "D": "existiert nicht"},
    "B",
    "Dieser Standardgrenzwert beträgt 1 und folgt u. a. aus der Regel von L'Hospital oder der Reihenentwicklung.",
    "Der Grenzwert ist grundlegend für die Ableitung von Sinus: (sin x)' = cos x.",
    "Forster, Analysis 1.",
    "Für kleine x gilt sin x ≈ x, daher nähert sich der Quotient 1.",
    "Erkläre die Regel von L'Hospital und ihre Voraussetzungen.")

add("Mathematik", "Vektorrechnung – Skalarprodukt", "mittel",
    "Das Skalarprodukt der Vektoren (1,2,3) und (4,0,−1) ist:",
    {"A": "1", "B": "7", "C": "11", "D": "0"},
    "A",
    "1·4 + 2·0 + 3·(−1) = 4 + 0 − 3 = 1.",
    "Ist das Skalarprodukt null, stehen die Vektoren senkrecht aufeinander.",
    "Lambacher Schweizer, Analytische Geometrie.",
    "a·b = |a||b|cos(φ); daraus lässt sich der Zwischenwinkel bestimmen.",
    "Wie berechnet man aus dem Skalarprodukt den Winkel zwischen zwei Vektoren?")

add("Mathematik", "Exponentialfunktion", "mittel",
    "Was ist die Ableitung von f(x) = e^x?",
    {"A": "x·e^(x−1)", "B": "e^x", "C": "e^(x+1)", "D": "1"},
    "B",
    "Die e-Funktion ist die einzige Funktion, die mit ihrer eigenen Ableitung übereinstimmt.",
    "Die Eulersche Zahl e ≈ 2,718 ist die Basis des natürlichen Logarithmus.",
    "Analysis Oberstufe, Kapitel e-Funktion.",
    "Wegen f'=f wächst e^x proportional zu seinem aktuellen Wert – typisch für Wachstumsprozesse.",
    "Warum eignet sich die e-Funktion zur Beschreibung von radioaktivem Zerfall?")

add("Mathematik", "Logarithmus", "mittel",
    "Was ist log₂(8)?",
    {"A": "2", "B": "3", "C": "4", "D": "16"},
    "B",
    "log₂(8) fragt: 2 hoch wie viel ergibt 8? Da 2³ = 8, ist die Antwort 3.",
    "Der Logarithmus ist die Umkehrung der Potenzierung.",
    "Bildungsplan Sekundarstufe I/II.",
    "2^3 = 8 ⇔ log₂(8) = 3.",
    "Wie lautet das Logarithmusgesetz für log(a·b)?")

add("Mathematik", "Prozentrechnung", "leicht",
    "Ein Preis von 80 € wird um 25 % erhöht. Wie hoch ist der neue Preis?",
    {"A": "100 €", "B": "105 €", "C": "95 €", "D": "120 €"},
    "A",
    "25 % von 80 € sind 20 €; 80 + 20 = 100 €. Alternativ: 80 · 1,25 = 100.",
    "Der Faktor für eine Erhöhung um p % ist (1 + p/100).",
    "Bildungsplan Sekundarstufe I.",
    "80 € · 1,25 = 100 €.",
    "Welcher Faktor kehrt eine Erhöhung um 25 % wieder um?")

add("Mathematik", "Trigonometrie", "mittel",
    "Welchen Wert hat sin(30°)?",
    {"A": "1/2", "B": "√2/2", "C": "√3/2", "D": "1"},
    "A", "sin(30°) = 0,5 ist ein Standardwert am Einheitskreis.",
    "Die Werte 0°, 30°, 45°, 60°, 90° bilden die wichtigsten Tabellenwerte.",
    "Bildungsplan Trigonometrie.", "sin(30°)=1/2, cos(30°)=√3/2.",
    "Warum ist sin(30°)=cos(60°)?")
add("Mathematik", "Trigonometrie", "mittel",
    "Welchen Wert hat cos(0°)?",
    {"A": "0", "B": "1", "C": "−1", "D": "1/2"},
    "B", "Am Einheitskreis entspricht cos der x-Koordinate; bei 0° ist sie 1.",
    "cos ist eine gerade Funktion: cos(−x)=cos(x).",
    "Bildungsplan Trigonometrie.", "cos(0°)=1, sin(0°)=0.",
    "Welche Periode hat die Kosinusfunktion?")
add("Mathematik", "Analysis – Extremstellen", "schwer",
    "Notwendige Bedingung für eine Extremstelle von f ist:",
    {"A": "f''(x)=0", "B": "f'(x)=0", "C": "f(x)=0", "D": "f'(x)>0"},
    "B", "An Extremstellen ist die Tangente waagerecht, also f'(x)=0 (notwendige Bedingung).",
    "Hinreichend wird es erst mit Vorzeichenwechsel von f' oder f''(x)≠0.",
    "Analysis Oberstufe, Kurvendiskussion.", "f'(x)=0 und f''(x)<0 → Hochpunkt.",
    "Was unterscheidet notwendige von hinreichenden Bedingungen?")
add("Mathematik", "Analysis – Wendepunkt", "schwer",
    "Ein Wendepunkt liegt vor, wenn gilt:",
    {"A": "f'(x)=0", "B": "f''(x)=0 mit Vorzeichenwechsel", "C": "f(x)=0", "D": "f'''(x)=0"},
    "B", "Am Wendepunkt ändert sich das Krümmungsverhalten; f'' wechselt das Vorzeichen.",
    "Hinreichend: f''(x)=0 und f'''(x)≠0.",
    "Analysis Oberstufe.", "Bei f(x)=x³ ist x=0 ein Wendepunkt.",
    "Was ist ein Sattelpunkt?")
add("Mathematik", "Stochastik – Binomialverteilung", "schwer",
    "Wie viele Erfolge erwartet man bei n=10 Versuchen mit p=0,2 im Mittel?",
    {"A": "0,2", "B": "2", "C": "5", "D": "10"},
    "B", "Der Erwartungswert der Binomialverteilung ist μ = n·p = 10·0,2 = 2.",
    "Die Varianz beträgt σ² = n·p·(1−p).",
    "Lambacher Schweizer, Stochastik.", "μ = n·p = 2.",
    "Unter welchen Bedingungen ist ein Experiment binomialverteilt?")
add("Mathematik", "Zahlbereiche", "leicht",
    "Welche Zahl ist irrational?",
    {"A": "0,75", "B": "√2", "C": "3/4", "D": "−5"},
    "B", "√2 lässt sich nicht als Bruch zweier ganzer Zahlen darstellen.",
    "Irrationale Zahlen haben unendliche, nicht periodische Dezimalbrüche.",
    "Bildungsplan Sekundarstufe I.", "√2 ≈ 1,41421356… ohne Periode.",
    "Beweise, dass √2 irrational ist.")
add("Mathematik", "Lineare Gleichungssysteme", "mittel",
    "Lösung von x+y=5 und x−y=1:",
    {"A": "x=3, y=2", "B": "x=2, y=3", "C": "x=4, y=1", "D": "x=1, y=4"},
    "A", "Addition beider Gleichungen: 2x=6 → x=3, daraus y=2.",
    "Lösungsverfahren: Einsetzen, Gleichsetzen, Additionsverfahren.",
    "Bildungsplan Sekundarstufe I.", "x=3, y=2 erfüllt beide Gleichungen.",
    "Wann hat ein LGS keine oder unendlich viele Lösungen?")
add("Mathematik", "Funktionen – Scheitelpunkt", "mittel",
    "Der Scheitelpunkt von f(x)=(x−2)²+3 liegt bei:",
    {"A": "(2,3)", "B": "(−2,3)", "C": "(2,−3)", "D": "(3,2)"},
    "A", "In der Scheitelpunktform f(x)=(x−d)²+e ist der Scheitel (d,e)=(2,3).",
    "Die Scheitelpunktform macht Verschiebungen direkt ablesbar.",
    "Bildungsplan Sekundarstufe I.", "Minimum der nach oben geöffneten Parabel: y=3.",
    "Wie wandelt man die Normalform in die Scheitelpunktform um?")
add("Mathematik", "Geometrie – Kreis", "leicht",
    "Die Fläche eines Kreises mit Radius 3 beträgt:",
    {"A": "6π", "B": "9π", "C": "3π", "D": "12π"},
    "B", "A = πr² = π·3² = 9π.",
    "Der Umfang ist U = 2πr.", "Bildungsplan Sekundarstufe I.",
    "A = π·9 ≈ 28,27 Flächeneinheiten.",
    "Wie hängen Kreisumfang und -fläche von r ab?")
add("Mathematik", "Potenzgesetze", "leicht",
    "Vereinfache a³ · a⁴:",
    {"A": "a¹²", "B": "a⁷", "C": "a₁", "D": "2a⁷"},
    "B", "Bei Multiplikation von Potenzen gleicher Basis werden die Exponenten addiert: 3+4=7.",
    "Potenzgesetze: a^m·a^n=a^(m+n), (a^m)^n=a^(m·n).",
    "Bildungsplan Sekundarstufe I.", "a³·a⁴ = a^(3+4) = a⁷.",
    "Was ergibt a⁰ und warum?")
add("Mathematik", "Bruchrechnung", "leicht",
    "Was ergibt 2/3 + 1/6?",
    {"A": "3/9", "B": "5/6", "C": "1/2", "D": "3/6"},
    "B", "Hauptnenner 6: 2/3=4/6, plus 1/6 = 5/6.",
    "Brüche müssen vor dem Addieren auf einen gemeinsamen Nenner gebracht werden.",
    "Bildungsplan Sekundarstufe I.", "4/6 + 1/6 = 5/6.",
    "Warum darf man beim Addieren Zähler nicht einfach addieren?")
add("Mathematik", "Analysis – Kettenregel", "schwer",
    "Ableitung von f(x) = (2x+1)³:",
    {"A": "3(2x+1)²", "B": "6(2x+1)²", "C": "2(2x+1)²", "D": "6x²"},
    "B", "Kettenregel: äußere Ableitung 3(2x+1)² mal innere Ableitung 2 = 6(2x+1)².",
    "Kettenregel: (f(g(x)))' = f'(g(x))·g'(x).",
    "Analysis Oberstufe.", "äußere · innere Ableitung.",
    "Wann benötigt man Produkt- statt Kettenregel?")
add("Mathematik", "Analysis – Produktregel", "schwer",
    "Ableitung von f(x) = x·e^x:",
    {"A": "e^x", "B": "x·e^x", "C": "(1+x)e^x", "D": "e^x + x"},
    "C", "Produktregel: (uv)'=u'v+uv' = 1·e^x + x·e^x = (1+x)e^x.",
    "Produktregel: (u·v)' = u'v + uv'.",
    "Analysis Oberstufe.", "1·e^x + x·e^x = (1+x)e^x.",
    "Leite die Quotientenregel aus der Produktregel her.")
add("Mathematik", "Geometrie – Volumen", "mittel",
    "Das Volumen einer Kugel mit Radius r ist:",
    {"A": "4πr²", "B": "(4/3)πr³", "C": "πr²h", "D": "(1/3)πr³"},
    "B", "Das Kugelvolumen beträgt V = (4/3)πr³.",
    "Die Oberfläche der Kugel ist O = 4πr².",
    "Formelsammlung Sekundarstufe.", "r=3 → V=(4/3)π·27=36π.",
    "Wie leitet man das Kugelvolumen mit Integralrechnung her?")
add("Mathematik", "Stochastik – Kombinatorik", "mittel",
    "Wie viele Möglichkeiten gibt es, 3 aus 5 Objekten ohne Reihenfolge zu wählen?",
    {"A": "10", "B": "15", "C": "60", "D": "125"},
    "A", "Binomialkoeffizient C(5,3)=5!/(3!·2!)=10.",
    "Ohne Reihenfolge: Kombination; mit Reihenfolge: Variation.",
    "Lambacher Schweizer, Stochastik.", "C(5,3)=10.",
    "Wie viele geordnete Auswahlen (Variationen) gibt es stattdessen?")
add("Mathematik", "Folgen und Reihen", "mittel",
    "Wie lautet das 5. Glied der geometrischen Folge mit a₁=2 und q=3?",
    {"A": "162", "B": "48", "C": "243", "D": "96"},
    "A", "a_n = a₁·q^(n−1) = 2·3⁴ = 2·81 = 162.",
    "Bei geometrischen Folgen ist der Quotient aufeinanderfolgender Glieder konstant.",
    "Analysis Oberstufe.", "a₅ = 2·3⁴ = 162.",
    "Wann konvergiert eine geometrische Reihe?")
add("Mathematik", "Betrag und Ungleichungen", "mittel",
    "Lösungsmenge von |x| < 3:",
    {"A": "x>3", "B": "−3<x<3", "C": "x<−3", "D": "x>−3"},
    "B", "Der Betrag kleiner 3 bedeutet Abstand kleiner 3 von 0, also −3<x<3.",
    "|x|<a ⇔ −a<x<a für a>0.",
    "Bildungsplan Sekundarstufe I.", "Intervall (−3, 3).",
    "Wie lautet die Lösung von |x|>3?")
add("Mathematik", "Analysis – Stammfunktion", "mittel",
    "Eine Stammfunktion von f(x)=cos x ist:",
    {"A": "−sin x", "B": "sin x", "C": "−cos x", "D": "tan x"},
    "B", "Da (sin x)' = cos x, ist sin x eine Stammfunktion von cos x.",
    "Stammfunktionen sind nur bis auf eine Konstante bestimmt.",
    "Analysis Oberstufe.", "∫cos x dx = sin x + C.",
    "Warum tritt die Integrationskonstante C auf?")
add("Mathematik", "Wahrscheinlichkeit – bedingt", "schwer",
    "Die Formel P(A|B) = P(A∩B)/P(B) beschreibt:",
    {"A": "Unabhängigkeit", "B": "bedingte Wahrscheinlichkeit", "C": "Erwartungswert", "D": "Varianz"},
    "B", "Sie gibt die Wahrscheinlichkeit von A unter der Bedingung an, dass B eingetreten ist.",
    "Der Satz von Bayes baut auf dieser Definition auf.",
    "Lambacher Schweizer, Stochastik.", "Baumdiagramme veranschaulichen bedingte Wahrscheinlichkeiten.",
    "Wann sind zwei Ereignisse stochastisch unabhängig?")
add("Mathematik", "Geometrie – Strahlensatz", "mittel",
    "Der Strahlensatz behandelt Verhältnisse bei:",
    {"A": "Kreisen", "B": "parallelen Geraden an sich schneidenden Strahlen", "C": "Kugeln", "D": "Vektoren"},
    "B", "Werden zwei sich schneidende Strahlen von Parallelen geschnitten, sind die Abschnitte proportional.",
    "Er wird zur indirekten Längenmessung genutzt (z. B. Baumhöhe).",
    "Bildungsplan Sekundarstufe I.", "Förstersche Höhenbestimmung nutzt den Strahlensatz.",
    "Wie bestimmt man mit dem Strahlensatz eine unzugängliche Länge?")
print("Mathematik batch 2 geladen")

# ---------------- PHYSIK ----------------
add("Physik", "Mechanik – Newton", "leicht",
    "Welche Einheit hat die Kraft im SI-System?",
    {"A": "Joule", "B": "Newton", "C": "Watt", "D": "Pascal"},
    "B", "1 Newton = 1 kg·m/s² ist die SI-Einheit der Kraft.",
    "Benannt nach Isaac Newton; F = m·a (2. Newtonsches Gesetz).",
    "Gerthsen Physik.", "10 kg mit 2 m/s² beschleunigt → F=20 N.",
    "Formuliere das dritte Newtonsche Gesetz.")
add("Physik", "Mechanik – Energie", "mittel",
    "Die kinetische Energie berechnet sich als:",
    {"A": "m·g·h", "B": "½·m·v²", "C": "m·v", "D": "F·s"},
    "B", "E_kin = ½ m v²; sie wächst quadratisch mit der Geschwindigkeit.",
    "Lageenergie ist E_pot = m·g·h.",
    "Bildungsplan Physik Oberstufe.", "Bei doppelter Geschwindigkeit vierfache E_kin.",
    "Warum ist der Bremsweg quadratisch von v abhängig?")
add("Physik", "Elektrizität – Ohmsches Gesetz", "leicht",
    "Das Ohmsche Gesetz lautet:",
    {"A": "U = R/I", "B": "U = R·I", "C": "R = U·I", "D": "I = U·R"},
    "B", "Spannung = Widerstand mal Stromstärke: U = R·I.",
    "Es gilt für ohmsche Leiter bei konstanter Temperatur.",
    "Gerthsen Physik.", "R=10Ω, I=2A → U=20V.",
    "Wann gilt das Ohmsche Gesetz nicht?")
add("Physik", "Optik", "mittel",
    "Was geschieht beim Übergang von Licht in ein optisch dichteres Medium?",
    {"A": "Es wird zum Lot hin gebrochen", "B": "Es wird vom Lot weg gebrochen", "C": "Es wird reflektiert", "D": "Nichts"},
    "A", "Beim Eintritt in ein dichteres Medium (größerer Brechungsindex) wird Licht zum Lot hin gebrochen.",
    "Beschrieben durch das Snelliussche Brechungsgesetz.",
    "Gerthsen Physik, Optik.", "Luft → Wasser: Strahl knickt zum Lot.",
    "Was ist Totalreflexion und wann tritt sie auf?")
add("Physik", "Atomphysik", "mittel",
    "Woraus besteht der Atomkern?",
    {"A": "Elektronen und Protonen", "B": "Protonen und Neutronen", "C": "nur Neutronen", "D": "Photonen"},
    "B", "Der Kern besteht aus positiv geladenen Protonen und neutralen Neutronen (Nukleonen).",
    "Elektronen umgeben den Kern in der Hülle.",
    "Bildungsplan Physik.", "Kohlenstoff-12: 6 Protonen, 6 Neutronen.",
    "Was unterscheidet Isotope eines Elements?")
add("Physik", "Wellen", "mittel",
    "Wie hängen Wellenlänge λ, Frequenz f und Geschwindigkeit c zusammen?",
    {"A": "c = λ/f", "B": "c = λ·f", "C": "c = f/λ", "D": "λ = c·f"},
    "B", "Die Ausbreitungsgeschwindigkeit ist Produkt aus Wellenlänge und Frequenz: c = λ·f.",
    "Gilt für alle Wellen, auch Licht und Schall.",
    "Gerthsen Physik, Wellenlehre.", "Licht: c≈3·10⁸ m/s.",
    "Was ist der Doppler-Effekt?")
add("Physik", "Thermodynamik", "mittel",
    "Der absolute Nullpunkt liegt bei:",
    {"A": "0 °C", "B": "−100 °C", "C": "−273,15 °C", "D": "100 K"},
    "C", "Bei −273,15 °C = 0 K ist die Teilchenbewegung minimal; tiefer geht es nicht.",
    "Die Kelvin-Skala beginnt am absoluten Nullpunkt.",
    "Bildungsplan Physik.", "0 °C = 273,15 K.",
    "Warum kann der absolute Nullpunkt nie ganz erreicht werden?")
add("Physik", "Gravitation", "mittel",
    "Die Fallbeschleunigung auf der Erde beträgt etwa:",
    {"A": "9,81 m/s²", "B": "1,62 m/s²", "C": "0 m/s²", "D": "100 m/s²"},
    "A", "g ≈ 9,81 m/s² ist die mittlere Erdbeschleunigung.",
    "Auf dem Mond ist g etwa sechsmal kleiner.",
    "Bildungsplan Physik.", "Freier Fall: v=g·t.",
    "Warum fallen im Vakuum Feder und Hammer gleich schnell?")
add("Physik", "Elektromagnetismus", "schwer",
    "Was beschreibt das Faradaysche Induktionsgesetz?",
    {"A": "Kraft auf Ladungen", "B": "Spannung durch Änderung des magnetischen Flusses", "C": "Widerstand", "D": "Lichtbrechung"},
    "B", "Eine zeitliche Änderung des magnetischen Flusses induziert eine Spannung.",
    "Grundlage von Generatoren und Transformatoren.",
    "Gerthsen Physik, Elektrodynamik.", "Bewegter Magnet in Spule erzeugt Spannung.",
    "Wie funktioniert ein Transformator?")
add("Physik", "Kernphysik", "mittel",
    "Welche Strahlung besteht aus Heliumkernen?",
    {"A": "Alphastrahlung", "B": "Betastrahlung", "C": "Gammastrahlung", "D": "Röntgenstrahlung"},
    "A", "Alphastrahlung besteht aus Heliumkernen (2 Protonen, 2 Neutronen).",
    "Beta ist Elektronenstrahlung, Gamma elektromagnetische Strahlung.",
    "Bildungsplan Physik.", "Alpha wird schon von Papier abgeschirmt.",
    "Ordne α, β, γ nach ihrem Durchdringungsvermögen.")
add("Physik", "Mechanik – Impuls", "schwer",
    "Der Impuls eines Körpers ist definiert als:",
    {"A": "m·a", "B": "m·v", "C": "½ m v²", "D": "F·t"},
    "B", "p = m·v. In abgeschlossenen Systemen ist der Gesamtimpuls erhalten.",
    "Impulserhaltung erklärt Stöße und Rückstoß.",
    "Gerthsen Physik.", "Raketenantrieb beruht auf Impulserhaltung.",
    "Unterscheide elastischen und unelastischen Stoß.")
add("Physik", "Schwingungen", "mittel",
    "Die Schwingungsdauer eines Fadenpendels hängt NICHT ab von:",
    {"A": "der Pendellänge", "B": "der Erdbeschleunigung", "C": "der Masse", "D": "keinem der Genannten"},
    "C", "T = 2π√(l/g) – die Masse spielt (bei kleinen Auslenkungen) keine Rolle.",
    "Gilt näherungsweise für kleine Winkel.",
    "Bildungsplan Physik.", "Vierfache Länge → doppelte Periode.",
    "Warum gilt die Formel nur für kleine Auslenkungen?")
add("Physik", "Quantenphysik", "schwer",
    "Der Photoeffekt zeigt, dass Licht:",
    {"A": "nur Welle ist", "B": "Teilchencharakter (Photonen) hat", "C": "keine Energie trägt", "D": "nicht reflektiert wird"},
    "B", "Die Energie der Photoelektronen hängt von der Frequenz, nicht der Intensität ab – Beleg für Lichtquanten.",
    "Einstein erhielt dafür 1921 den Nobelpreis.",
    "Bildungsplan Physik Oberstufe.", "E = h·f (Planck-Einstein-Beziehung).",
    "Was besagt der Welle-Teilchen-Dualismus?")
add("Physik", "Elektrizität – Leistung", "mittel",
    "Die elektrische Leistung berechnet sich als:",
    {"A": "P = U·I", "B": "P = U/I", "C": "P = R·I", "D": "P = U·R"},
    "A", "P = U·I (Spannung mal Strom). Einheit: Watt.",
    "Mit U=R·I folgt auch P = I²·R.",
    "Gerthsen Physik.", "230V, 0,5A → P=115W.",
    "Wie berechnet man den Energieverbrauch in kWh?")
add("Physik", "Druck", "leicht",
    "Druck ist definiert als:",
    {"A": "Kraft mal Fläche", "B": "Kraft pro Fläche", "C": "Fläche pro Kraft", "D": "Masse pro Volumen"},
    "B", "p = F/A; Einheit Pascal (1 Pa = 1 N/m²).",
    "Je kleiner die Fläche, desto größer der Druck bei gleicher Kraft.",
    "Bildungsplan Physik.", "Spitze Nadel → hoher Druck.",
    "Warum sinkt man mit Schneeschuhen weniger ein?")
print("Physik batch geladen")

# ---------------- CHEMIE ----------------
add("Chemie", "Atombau", "leicht",
    "Wie viele Protonen hat ein Sauerstoffatom?",
    {"A": "6", "B": "8", "C": "16", "D": "2"},
    "B", "Die Ordnungszahl von Sauerstoff ist 8, also 8 Protonen.",
    "Die Ordnungszahl bestimmt das Element eindeutig.",
    "Periodensystem der Elemente.", "O hat die Ordnungszahl 8.",
    "Was gibt die Massenzahl an?")
add("Chemie", "Periodensystem", "leicht",
    "Elemente einer Hauptgruppe haben gemeinsam:",
    {"A": "gleiche Protonenzahl", "B": "gleiche Zahl an Außenelektronen", "C": "gleiche Masse", "D": "gleiche Neutronenzahl"},
    "B", "Hauptgruppenelemente besitzen die gleiche Anzahl Valenzelektronen und ähneln sich chemisch.",
    "Die Gruppennummer entspricht der Zahl der Außenelektronen.",
    "Periodensystem.", "Alkalimetalle (1. HG) haben 1 Außenelektron.",
    "Warum sind Edelgase besonders reaktionsträge?")
add("Chemie", "Chemische Bindung", "mittel",
    "Welche Bindung liegt in Natriumchlorid (NaCl) vor?",
    {"A": "Atombindung", "B": "Ionenbindung", "C": "Metallbindung", "D": "Wasserstoffbrücke"},
    "B", "Natrium gibt ein Elektron an Chlor ab; die entstehenden Ionen ziehen sich an (Ionenbindung).",
    "Ionenverbindungen bilden Kristallgitter und leiten geschmolzen Strom.",
    "Bildungsplan Chemie.", "Na⁺ und Cl⁻ im Ionengitter.",
    "Wie unterscheiden sich Ionen- und Atombindung?")
add("Chemie", "Säuren und Basen", "mittel",
    "Eine Lösung mit pH 3 ist:",
    {"A": "neutral", "B": "sauer", "C": "basisch", "D": "nicht bestimmbar"},
    "B", "pH < 7 bedeutet sauer, pH = 7 neutral, pH > 7 basisch.",
    "Der pH-Wert ist der negative dekadische Logarithmus der H₃O⁺-Konzentration.",
    "Bildungsplan Chemie.", "Zitronensaft hat etwa pH 2–3.",
    "Was passiert bei einer Neutralisation?")
add("Chemie", "Stöchiometrie", "mittel",
    "Wie viele Atome sind in einem Mol enthalten?",
    {"A": "6,022·10²³", "B": "3,14", "C": "1000", "D": "9,81"},
    "A", "Die Avogadro-Konstante beträgt etwa 6,022·10²³ Teilchen pro Mol.",
    "Das Mol ist die SI-Einheit der Stoffmenge.",
    "Bildungsplan Chemie.", "1 mol Kohlenstoff wiegt 12 g.",
    "Wie berechnet man die Stoffmenge aus Masse und molarer Masse?")
add("Chemie", "Organische Chemie", "mittel",
    "Welche Summenformel hat Methan?",
    {"A": "CH₄", "B": "C₂H₆", "C": "CO₂", "D": "CH₃OH"},
    "A", "Methan ist der einfachste Kohlenwasserstoff: ein C-Atom mit vier H-Atomen.",
    "Methan ist das Hauptbestandteil von Erdgas und ein Treibhausgas.",
    "Bildungsplan Chemie.", "CH₄ – tetraedrische Struktur.",
    "Was sind Alkane, Alkene und Alkine?")
add("Chemie", "Redoxreaktion", "schwer",
    "Bei einer Oxidation werden Elektronen:",
    {"A": "aufgenommen", "B": "abgegeben", "C": "geteilt", "D": "nicht übertragen"},
    "B", "Oxidation ist Elektronenabgabe, Reduktion ist Elektronenaufnahme.",
    "Oxidation und Reduktion treten stets gekoppelt auf (Redoxreaktion).",
    "Bildungsplan Chemie.", "Eselsbrücke: OIL RIG – Oxidation Is Loss, Reduction Is Gain.",
    "Was ist ein Oxidationsmittel?")
add("Chemie", "Aggregatzustände", "leicht",
    "Der direkte Übergang vom festen in den gasförmigen Zustand heißt:",
    {"A": "Schmelzen", "B": "Sublimation", "C": "Kondensation", "D": "Erstarren"},
    "B", "Sublimation ist der direkte Übergang fest → gasförmig ohne flüssige Phase.",
    "Beispiel: Trockeneis (festes CO₂).",
    "Bildungsplan Chemie.", "Trockeneis sublimiert bei Raumtemperatur.",
    "Wie heißt der umgekehrte Vorgang?")
add("Chemie", "Katalyse", "mittel",
    "Ein Katalysator bewirkt, dass eine Reaktion:",
    {"A": "mehr Energie liefert", "B": "schneller abläuft", "C": "rückgängig wird", "D": "nicht stattfindet"},
    "B", "Ein Katalysator senkt die Aktivierungsenergie und beschleunigt die Reaktion, ohne verbraucht zu werden.",
    "Enzyme sind biologische Katalysatoren.",
    "Bildungsplan Chemie.", "Autokatalysator wandelt Abgase um.",
    "Wird das Gleichgewicht durch einen Katalysator verschoben?")
add("Chemie", "Chemisches Gleichgewicht", "schwer",
    "Das Prinzip von Le Chatelier beschreibt:",
    {"A": "Atombau", "B": "das Ausweichen eines Gleichgewichts auf Störung", "C": "Säurestärke", "D": "Elektrolyse"},
    "B", "Bei Störung (Druck, Temperatur, Konzentration) weicht das Gleichgewicht so aus, dass die Störung vermindert wird.",
    "Wichtig z. B. bei der Ammoniaksynthese (Haber-Bosch).",
    "Bildungsplan Chemie Oberstufe.", "Druckerhöhung begünstigt die Seite mit weniger Gasmolekülen.",
    "Wie beeinflusst Temperatur ein exothermes Gleichgewicht?")
add("Chemie", "Wasser", "leicht",
    "Warum ist Wasser ein Dipol?",
    {"A": "gleichmäßige Ladung", "B": "gewinkelter Bau und Elektronegativitätsunterschied", "C": "linearer Bau", "D": "keine Bindungen"},
    "B", "Der Winkel und die höhere Elektronegativität von O erzeugen Teilladungen – Wasser ist ein Dipol.",
    "Daher Wasserstoffbrückenbindungen und hohe Siedetemperatur.",
    "Bildungsplan Chemie.", "H₂O-Molekül mit 104,5° Winkel.",
    "Erkläre die Anomalie des Wassers.")

# ---------------- BIOLOGIE ----------------
add("Biologie", "Zellbiologie", "leicht",
    "Welches Organell ist das 'Kraftwerk' der Zelle?",
    {"A": "Zellkern", "B": "Mitochondrium", "C": "Ribosom", "D": "Golgi-Apparat"},
    "B", "In den Mitochondrien läuft die Zellatmung ab und ATP wird gewonnen.",
    "Mitochondrien besitzen eigene DNA (Endosymbiontentheorie).",
    "Bildungsplan Biologie.", "Muskelzellen enthalten besonders viele Mitochondrien.",
    "Was besagt die Endosymbiontentheorie?")
add("Biologie", "Genetik", "mittel",
    "Die Basenpaarung in der DNA erfolgt zwischen:",
    {"A": "A-G und C-T", "B": "A-T und G-C", "C": "A-C und G-T", "D": "A-U und G-C"},
    "B", "Adenin paart mit Thymin, Guanin mit Cytosin (komplementäre Basenpaarung).",
    "In RNA ersetzt Uracil das Thymin.",
    "Bildungsplan Biologie.", "A=T über 2, G≡C über 3 Wasserstoffbrücken.",
    "Warum ist die komplementäre Paarung für die Replikation wichtig?")
add("Biologie", "Evolution", "mittel",
    "Wer begründete die Evolutionstheorie durch natürliche Selektion?",
    {"A": "Mendel", "B": "Darwin", "C": "Linné", "D": "Lamarck"},
    "B", "Charles Darwin beschrieb 1859 die Evolution durch natürliche Auslese.",
    "Werk: 'On the Origin of Species'.",
    "Bildungsplan Biologie.", "Angepasste Individuen pflanzen sich erfolgreicher fort.",
    "Worin unterscheidet sich Darwin von Lamarck?")
add("Biologie", "Ökologie", "mittel",
    "Organismen, die Biomasse aus anorganischen Stoffen aufbauen, heißen:",
    {"A": "Konsumenten", "B": "Produzenten", "C": "Destruenten", "D": "Parasiten"},
    "B", "Produzenten (z. B. Pflanzen) bauen mit Fotosynthese organische Stoffe auf.",
    "Konsumenten ernähren sich von anderen, Destruenten zersetzen Totes.",
    "Bildungsplan Biologie.", "Grüne Pflanzen am Beginn der Nahrungskette.",
    "Welche Rolle spielen Destruenten im Stoffkreislauf?")
add("Biologie", "Fotosynthese", "mittel",
    "Was ist ein Hauptprodukt der Fotosynthese?",
    {"A": "Kohlenstoffdioxid", "B": "Glucose und Sauerstoff", "C": "Stickstoff", "D": "Methan"},
    "B", "Aus CO₂ und Wasser entstehen mithilfe von Lichtenergie Glucose und Sauerstoff.",
    "Gleichung: 6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂.",
    "Bildungsplan Biologie.", "Ort: Chloroplasten.",
    "Unterscheide Licht- und Dunkelreaktion.")
add("Biologie", "Humanbiologie", "leicht",
    "Welches Organ reinigt das Blut und bildet Harn?",
    {"A": "Leber", "B": "Niere", "C": "Milz", "D": "Lunge"},
    "B", "Die Nieren filtern das Blut und bilden Harn zur Ausscheidung.",
    "Pro Tag werden etwa 180 Liter Primärharn filtriert.",
    "Bildungsplan Biologie.", "Funktionseinheit: Nephron.",
    "Wie wird der Wasserhaushalt des Körpers reguliert?")
add("Biologie", "Neurobiologie", "schwer",
    "Wie wird ein Signal am Spalt zwischen zwei Nervenzellen übertragen?",
    {"A": "elektrisch direkt", "B": "chemisch über Neurotransmitter", "C": "gar nicht", "D": "über Hormone im Blut"},
    "B", "An der Synapse übertragen Neurotransmitter das Signal chemisch auf die nächste Zelle.",
    "Beispiel-Transmitter: Acetylcholin, Dopamin.",
    "Bildungsplan Biologie Oberstufe.", "Vesikel schütten Transmitter in den synaptischen Spalt.",
    "Was ist das Ruhepotenzial einer Nervenzelle?")
add("Biologie", "Genetik – Mendel", "mittel",
    "Bei einem dominant-rezessiven Erbgang mit heterozygoten Eltern (Aa x Aa) beträgt das phänotypische Verhältnis:",
    {"A": "1:1", "B": "3:1", "C": "9:3:3:1", "D": "2:1"},
    "B", "In der F2-Generation treten dominantes zu rezessivem Merkmal im Verhältnis 3:1 auf.",
    "Mendels Spaltungsregel (2. Mendelsche Regel).",
    "Bildungsplan Biologie.", "Erbsen: 3 gelb : 1 grün.",
    "Wie lautet die Uniformitätsregel?")
add("Biologie", "Immunsystem", "mittel",
    "Welche Zellen bilden Antikörper?",
    {"A": "rote Blutkörperchen", "B": "B-Lymphozyten", "C": "Nervenzellen", "D": "Thrombozyten"},
    "B", "B-Lymphozyten (Plasmazellen) produzieren spezifische Antikörper.",
    "Teil der spezifischen (adaptiven) Immunabwehr.",
    "Bildungsplan Biologie.", "Gedächtniszellen ermöglichen schnelle Zweitreaktion.",
    "Wie wirkt eine Impfung?")
add("Biologie", "Stoffwechsel", "mittel",
    "Bei der Zellatmung wird Glucose abgebaut unter Verbrauch von:",
    {"A": "Stickstoff", "B": "Sauerstoff", "C": "Kohlenstoffdioxid", "D": "Wasserstoff"},
    "B", "Die aerobe Zellatmung benötigt Sauerstoff und liefert CO₂, Wasser und ATP.",
    "Umkehrung der Fotosynthese-Bilanz.",
    "Bildungsplan Biologie.", "C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O + Energie.",
    "Was passiert bei der Gärung ohne Sauerstoff?")
print("Chemie + Biologie batch geladen")

# ---------------- INFORMATIK ----------------
add("Informatik", "Zahlensysteme", "leicht",
    "Welche Dezimalzahl entspricht der Binärzahl 1010?",
    {"A": "8", "B": "10", "C": "12", "D": "20"},
    "B", "1010₂ = 8+0+2+0 = 10.",
    "Jede Stelle steht für eine Zweierpotenz.",
    "Bildungsplan Informatik.", "8·1 + 4·0 + 2·1 + 1·0 = 10.",
    "Wie wandelt man 10 in binär um?")
add("Informatik", "Datenmengen", "leicht",
    "Wie viele Bit hat ein Byte?",
    {"A": "4", "B": "8", "C": "16", "D": "1024"},
    "B", "Ein Byte besteht aus 8 Bit und kann 256 Zustände darstellen.",
    "1 kB = 1000 Byte (bzw. 1024 im Binärpräfix KiB).",
    "Bildungsplan Informatik.", "2⁸ = 256 Möglichkeiten.",
    "Was ist der Unterschied zwischen KB und KiB?")
add("Informatik", "Algorithmik", "mittel",
    "Welche Zeitkomplexität hat die binäre Suche?",
    {"A": "O(n)", "B": "O(log n)", "C": "O(n²)", "D": "O(1)"},
    "B", "Die binäre Suche halbiert den Suchbereich in jedem Schritt: O(log n).",
    "Voraussetzung: die Daten müssen sortiert sein.",
    "Bildungsplan Informatik Oberstufe.", "1024 Elemente → maximal 10 Schritte.",
    "Warum muss die Liste sortiert sein?")
add("Informatik", "Programmierung", "leicht",
    "Was bewirkt eine for-Schleife?",
    {"A": "einmalige Ausführung", "B": "wiederholte Ausführung mit Zähler", "C": "Abbruch", "D": "Funktionsdefinition"},
    "B", "Eine for-Schleife wiederholt einen Block eine festgelegte Anzahl von Malen.",
    "Alternative: while-Schleife (bedingungsgesteuert).",
    "Bildungsplan Informatik.", "for i in range(5): print(i).",
    "Wann nutzt man while statt for?")
add("Informatik", "Datenstrukturen", "mittel",
    "Nach welchem Prinzip arbeitet ein Stapel (Stack)?",
    {"A": "FIFO", "B": "LIFO", "C": "zufällig", "D": "sortiert"},
    "B", "Ein Stack arbeitet nach LIFO: Last In, First Out.",
    "Eine Warteschlange (Queue) arbeitet dagegen nach FIFO.",
    "Bildungsplan Informatik.", "Rückgängig-Funktion nutzt einen Stack.",
    "Nenne eine Anwendung einer Queue.")
add("Informatik", "Boolesche Logik", "mittel",
    "Was ergibt WAHR UND FALSCH?",
    {"A": "WAHR", "B": "FALSCH", "C": "undefiniert", "D": "beides"},
    "B", "Die UND-Verknüpfung ist nur wahr, wenn beide Operanden wahr sind.",
    "ODER ist wahr, wenn mindestens einer wahr ist.",
    "Bildungsplan Informatik.", "Wahrheitstabelle der Konjunktion.",
    "Wann ist eine ODER-Verknüpfung falsch?")
add("Informatik", "Netzwerke", "mittel",
    "Wofür steht die Abkürzung 'IP' in IP-Adresse?",
    {"A": "Internet Provider", "B": "Internet Protocol", "C": "Internal Process", "D": "Input Port"},
    "B", "IP steht für Internet Protocol – es adressiert Geräte im Netzwerk.",
    "IPv4 nutzt 32 Bit, IPv6 128 Bit.",
    "Bildungsplan Informatik.", "192.168.0.1 ist eine IPv4-Adresse.",
    "Warum war die Umstellung auf IPv6 nötig?")
add("Informatik", "Datenschutz", "leicht",
    "Welches Gesetz regelt in der EU den Datenschutz?",
    {"A": "StGB", "B": "DSGVO", "C": "BGB", "D": "GG"},
    "B", "Die Datenschutz-Grundverordnung (DSGVO) regelt den Umgang mit personenbezogenen Daten.",
    "In Kraft seit Mai 2018.",
    "Bildungsplan Informatik/Gemeinschaftskunde.", "Recht auf Auskunft und Löschung.",
    "Was sind personenbezogene Daten?")
add("Informatik", "Verschlüsselung", "schwer",
    "Bei asymmetrischer Verschlüsselung nutzt man:",
    {"A": "einen gemeinsamen Schlüssel", "B": "ein Schlüsselpaar (öffentlich/privat)", "C": "keinen Schlüssel", "D": "nur Passwörter"},
    "B", "Es gibt einen öffentlichen Schlüssel zum Verschlüsseln und einen privaten zum Entschlüsseln.",
    "Beispiel: RSA-Verfahren.",
    "Bildungsplan Informatik.", "HTTPS nutzt asymmetrische Verfahren beim Verbindungsaufbau.",
    "Was ist eine digitale Signatur?")
add("Informatik", "Hardware", "leicht",
    "Welche Komponente führt Berechnungen aus?",
    {"A": "Festplatte", "B": "CPU", "C": "Monitor", "D": "Tastatur"},
    "B", "Die CPU (Prozessor) führt die Rechenoperationen aus.",
    "Der Arbeitsspeicher (RAM) hält Daten zur schnellen Verarbeitung bereit.",
    "Bildungsplan Informatik.", "Taktfrequenz in GHz.",
    "Welche Rolle spielt der Arbeitsspeicher?")
add("Informatik", "Internet", "leicht",
    "Was ist eine URL?",
    {"A": "ein Virus", "B": "die Adresse einer Webressource", "C": "ein Programmierfehler", "D": "ein Dateiformat"},
    "B", "Eine URL ist der eindeutige Adressverweis auf eine Ressource im Web.",
    "Aufbau: Protokoll, Host, Pfad.",
    "Bildungsplan Informatik.", "https://www.beispiel.de/seite.",
    "Welche Aufgabe hat das DNS?")
add("Informatik", "Softwareentwicklung", "mittel",
    "Was beschreibt ein Flussdiagramm (Programmablaufplan)?",
    {"A": "die Hardware", "B": "den Ablauf eines Algorithmus grafisch", "C": "eine Datenbank", "D": "das Netzwerk"},
    "B", "Ein PAP stellt die Schritte und Verzweigungen eines Algorithmus grafisch dar.",
    "Symbole: Raute für Verzweigung, Rechteck für Operation.",
    "Bildungsplan Informatik.", "Verzweigung = Raute mit ja/nein.",
    "Wie stellt man eine Schleife im PAP dar?")
print("Informatik batch geladen")

# ---------------- DEUTSCH ----------------
add("Deutsch", "Literaturepochen", "mittel",
    "Welche Epoche betont Gefühl, Natur und Individualität und wendet sich gegen die Aufklärung?",
    {"A": "Barock", "B": "Romantik", "C": "Realismus", "D": "Aufklärung"},
    "B", "Die Romantik (ca. 1795–1848) stellt Gefühl, Sehnsucht und Natur in den Mittelpunkt.",
    "Zentrale Motive: blaue Blume, Nacht, Fernweh.",
    "Bildungsplan Deutsch Oberstufe.", "Eichendorff, 'Mondnacht'.",
    "Wie unterscheidet sich Romantik von der Klassik?")
add("Deutsch", "Grammatik – Kasus", "leicht",
    "In welchem Fall steht das Objekt in 'Ich gebe dem Kind ein Buch'? ('dem Kind')",
    {"A": "Nominativ", "B": "Genitiv", "C": "Dativ", "D": "Akkusativ"},
    "C", "'dem Kind' ist das Dativobjekt (Wem gebe ich etwas?).",
    "'ein Buch' ist das Akkusativobjekt.",
    "Bildungsplan Deutsch.", "Frageprobe: Wem? → Dativ.",
    "Welche Verben verlangen den Genitiv?")
add("Deutsch", "Lyrik – Metrik", "mittel",
    "Ein Versmaß aus unbetonter und betonter Silbe heißt:",
    {"A": "Trochäus", "B": "Jambus", "C": "Daktylus", "D": "Anapäst"},
    "B", "Der Jambus besteht aus unbetont–betont (x´).",
    "Trochäus ist umgekehrt: betont–unbetont.",
    "Bildungsplan Deutsch.", "'Ge-SANG' ist jambisch.",
    "Welche Wirkung hat ein Daktylus?")
add("Deutsch", "Erzähltechnik", "mittel",
    "Wie nennt man die Erzählweise, die Gedanken ungefiltert wiedergibt?",
    {"A": "auktorial", "B": "innerer Monolog / Bewusstseinsstrom", "C": "personal", "D": "neutral"},
    "B", "Der innere Monolog bzw. Bewusstseinsstrom gibt Gedanken unmittelbar wieder.",
    "Beispiel: Schnitzlers 'Leutnant Gustl'.",
    "Bildungsplan Deutsch Oberstufe.", "Ich-Erzählung ohne Vermittlung.",
    "Was kennzeichnet einen auktorialen Erzähler?")
add("Deutsch", "Rhetorik", "leicht",
    "Welche rhetorische Figur liegt in 'Leben wie Gott in Frankreich' vor?",
    {"A": "Metapher", "B": "Vergleich", "C": "Ironie", "D": "Alliteration"},
    "B", "Das Wort 'wie' kennzeichnet einen Vergleich.",
    "Eine Metapher wäre ohne Vergleichswort.",
    "Bildungsplan Deutsch.", "'stark wie ein Bär' = Vergleich.",
    "Worin unterscheiden sich Metapher und Vergleich?")
add("Deutsch", "Drama", "mittel",
    "Der klassische Aufbau eines Dramas nach Freytag hat wie viele Akte?",
    {"A": "3", "B": "5", "C": "7", "D": "2"},
    "B", "Freytags Pyramide beschreibt den klassischen fünfaktigen Aufbau mit Höhepunkt im 3. Akt.",
    "Teile: Exposition, steigende Handlung, Höhepunkt, fallende Handlung, Katastrophe.",
    "Bildungsplan Deutsch.", "Schillers 'Kabale und Liebe' ist fünfaktig.",
    "Was unterscheidet offene von geschlossener Dramenform?")
add("Deutsch", "Rechtschreibung", "leicht",
    "Welche Schreibung ist korrekt?",
    {"A": "däs", "B": "dass (Konjunktion)", "C": "dasß", "D": "daas"},
    "B", "Die Konjunktion wird 'dass' geschrieben, das Relativ-/Artikelwort 'das'.",
    "Ersatzprobe: lässt sich 'das' durch 'dieses/welches' ersetzen, schreibt man 'das'.",
    "Bildungsplan Deutsch.", "'Ich weiß, dass du kommst.'",
    "Wann schreibt man 'das' mit einem s?")
add("Deutsch", "Sprachgeschichte", "mittel",
    "Wer übersetzte die Bibel ins Deutsche und prägte die Schriftsprache?",
    {"A": "Goethe", "B": "Luther", "C": "Gutenberg", "D": "Grimm"},
    "B", "Martin Luthers Bibelübersetzung (1522/1534) prägte die neuhochdeutsche Schriftsprache.",
    "Er orientierte sich an der Volkssprache ('dem Volk aufs Maul schauen').",
    "Bildungsplan Deutsch.", "Lutherdeutsch als Vorläufer der Standardsprache.",
    "Welche Rolle spielte der Buchdruck dabei?")
add("Deutsch", "Textsorten", "leicht",
    "Welche Textsorte will überwiegend informieren?",
    {"A": "Kommentar", "B": "Nachricht/Bericht", "C": "Glosse", "D": "Satire"},
    "B", "Die Nachricht informiert sachlich; der Kommentar wertet und meint.",
    "Berichtende Texte beantworten die W-Fragen.",
    "Bildungsplan Deutsch.", "Wer, was, wann, wo, wie, warum.",
    "Woran erkennt man einen meinungsbetonten Text?")
add("Deutsch", "Literatur – Goethe", "mittel",
    "Welches Werk stammt von Goethe?",
    {"A": "Die Räuber", "B": "Faust", "C": "Woyzeck", "D": "Der Prozess"},
    "B", "'Faust' ist Goethes bekanntestes Drama.",
    "'Die Räuber' ist von Schiller, 'Woyzeck' von Büchner, 'Der Prozess' von Kafka.",
    "Bildungsplan Deutsch Oberstufe.", "Faust I erschien 1808.",
    "Worum geht es im Gelehrtentragödie-Teil von Faust?")
add("Deutsch", "Argumentation", "mittel",
    "Ein Beispiel, das eine Behauptung stützt, nennt man:",
    {"A": "These", "B": "Beleg/Beispiel", "C": "Fazit", "D": "Einleitung"},
    "B", "Eine Argumentation besteht aus These, Begründung und stützendem Beleg/Beispiel.",
    "Aufbau einer erörternden Argumentation.",
    "Bildungsplan Deutsch.", "These – Begründung – Beispiel.",
    "Was ist ein Scheinargument?")

# ---------------- ENGLISCH ----------------
add("Englisch", "Grammar – Tenses", "leicht",
    "Which sentence is in the present perfect?",
    {"A": "I go home.", "B": "I have gone home.", "C": "I went home.", "D": "I will go home."},
    "B", "Present perfect uses 'have/has' + past participle.",
    "It links a past action to the present.",
    "Bildungsplan Englisch.", "'I have finished my homework.'",
    "When do you use present perfect instead of simple past?")
add("Englisch", "Vocabulary", "leicht",
    "What is the opposite of 'ancient'?",
    {"A": "old", "B": "modern", "C": "huge", "D": "famous"},
    "B", "'Ancient' means very old; its antonym is 'modern'.",
    "Antonyms help broaden vocabulary.",
    "Bildungsplan Englisch.", "ancient castle ↔ modern building.",
    "Give a synonym for 'ancient'.")
add("Englisch", "Grammar – Conditionals", "mittel",
    "'If I ___ rich, I would travel.' Which form fits?",
    {"A": "am", "B": "were", "C": "will be", "D": "have been"},
    "B", "The second conditional (unreal present) uses past subjunctive 'were'.",
    "Structure: if + past, would + infinitive.",
    "Bildungsplan Englisch.", "'If I were you, I would stay.'",
    "What does the third conditional express?")
add("Englisch", "Literature", "mittel",
    "Who wrote 'Romeo and Juliet'?",
    {"A": "Charles Dickens", "B": "William Shakespeare", "C": "Jane Austen", "D": "George Orwell"},
    "B", "Shakespeare wrote the tragedy 'Romeo and Juliet' around 1595.",
    "He is regarded as the greatest English-language dramatist.",
    "Bildungsplan Englisch.", "The play is set in Verona.",
    "Name another Shakespearean tragedy.")
add("Englisch", "Grammar – Articles", "leicht",
    "Choose the correct article: '___ university is near.'",
    {"A": "a", "B": "an", "C": "the only (no choice)", "D": "no article"},
    "A", "'University' starts with a consonant sound /ju:/, so 'a' is used.",
    "The sound, not the letter, decides a/an.",
    "Bildungsplan Englisch.", "a university, an hour.",
    "Why is it 'an hour' but 'a house'?")
add("Englisch", "Idioms", "mittel",
    "What does 'to break the ice' mean?",
    {"A": "to be cold", "B": "to ease tension in a social situation", "C": "to destroy something", "D": "to win"},
    "B", "'Break the ice' means to reduce awkwardness and start a conversation.",
    "Idioms cannot be understood word by word.",
    "Bildungsplan Englisch.", "A joke can break the ice.",
    "Explain the idiom 'piece of cake'.")
add("Englisch", "Grammar – Passive", "mittel",
    "Passive of 'They build houses':",
    {"A": "Houses build.", "B": "Houses are built.", "C": "Houses were build.", "D": "Houses building."},
    "B", "Passive present simple: 'are' + past participle 'built'.",
    "The passive focuses on the action's receiver.",
    "Bildungsplan Englisch.", "'English is spoken here.'",
    "When is the passive preferred over the active?")
add("Englisch", "Text analysis", "mittel",
    "A text that tries to persuade the reader is called:",
    {"A": "narrative", "B": "argumentative/persuasive", "C": "descriptive", "D": "instructive"},
    "B", "Persuasive texts aim to convince using arguments and rhetorical devices.",
    "Look for emotive language and rhetorical questions.",
    "Bildungsplan Englisch.", "An advertisement is persuasive.",
    "Name two rhetorical devices used in persuasion.")
print("Deutsch + Englisch batch geladen")

# ---------------- LATEIN ----------------
add("Latein", "Wortschatz", "leicht",
    "Was bedeutet das lateinische Wort 'bellum'?",
    {"A": "schön", "B": "Krieg", "C": "Buch", "D": "gut"},
    "B", "'bellum, -i n.' bedeutet 'Krieg'. Nicht zu verwechseln mit 'bellus' (hübsch).",
    "Ableitung: 'bellizist' = Kriegsbefürworter.",
    "Bildungsplan Latein.", "'bellum gerere' = Krieg führen.",
    "Welche Fremdwörter leiten sich von 'bellum' ab?")
add("Latein", "Grammatik – Kasus", "mittel",
    "Welcher Kasus steht typischerweise nach der Präposition 'in' bei Ortsangabe (wo)?",
    {"A": "Akkusativ", "B": "Ablativ", "C": "Genitiv", "D": "Dativ"},
    "B", "'in' + Ablativ gibt den Ort an (wo?), 'in' + Akkusativ die Richtung (wohin?).",
    "Diese Unterscheidung ist zentral für Präpositionen.",
    "Bildungsplan Latein.", "'in urbe' (in der Stadt) vs. 'in urbem' (in die Stadt).",
    "Nenne weitere Präpositionen mit Ablativ.")
add("Latein", "Übersetzung", "mittel",
    "Was heißt 'veni, vidi, vici'?",
    {"A": "Ich lebe, liebe, lache", "B": "Ich kam, sah, siegte", "C": "Ich gehe, stehe, falle", "D": "Ich lese, schreibe, denke"},
    "B", "Cäsars berühmter Ausspruch: 'Ich kam, ich sah, ich siegte.'",
    "Perfektformen der 3. Person Singular im Lateinischen.",
    "Bildungsplan Latein.", "Trikolon mit Alliteration.",
    "Welches Stilmittel prägt diesen Satz?")
add("Latein", "Mythologie", "leicht",
    "Wer ist in der römischen Mythologie der Göttervater?",
    {"A": "Mars", "B": "Jupiter", "C": "Neptun", "D": "Merkur"},
    "B", "Jupiter ist der höchste römische Gott (griech. Zeus).",
    "Mars = Krieg, Neptun = Meer, Merkur = Handel/Boten.",
    "Bildungsplan Latein.", "Jupiter Optimus Maximus.",
    "Welcher griechische Gott entspricht Jupiter?")
add("Latein", "Grammatik – AcI", "schwer",
    "Der 'Accusativus cum Infinitivo' wird meist übersetzt mit:",
    {"A": "einem Relativsatz", "B": "einem dass-Satz", "C": "einem Fragesatz", "D": "einem Imperativ"},
    "B", "Der AcI wird im Deutschen typischerweise mit einem 'dass'-Satz wiedergegeben.",
    "Auslöser sind Verben des Sagens, Meinens, Wahrnehmens.",
    "Bildungsplan Latein.", "'Scio te venire' = Ich weiß, dass du kommst.",
    "Welche Verben lösen einen AcI aus?")

# ---------------- FRANZOESISCH ----------------
add("Französisch", "Grammatik – Artikel", "leicht",
    "Welcher bestimmte Artikel passt zu 'maison' (Haus)?",
    {"A": "le", "B": "la", "C": "les", "D": "l'"},
    "B", "'maison' ist feminin, daher 'la maison'.",
    "Französische Substantive haben ein grammatisches Geschlecht.",
    "Bildungsplan Französisch.", "la maison, le livre.",
    "Wann benutzt man den Artikel l'?")
add("Französisch", "Wortschatz", "leicht",
    "Was bedeutet 'merci'?",
    {"A": "bitte", "B": "danke", "C": "hallo", "D": "tschüss"},
    "B", "'merci' heißt 'danke'. 'bitte' ist 's'il vous plaît' bzw. 'de rien' als Antwort.",
    "Höfliche Grundformeln gehören zum Basiswortschatz.",
    "Bildungsplan Französisch.", "'Merci beaucoup' = vielen Dank.",
    "Wie antwortet man höflich auf 'merci'?")
add("Französisch", "Konjugation", "mittel",
    "Wie lautet 'je' von 'être' (sein) im Präsens?",
    {"A": "suis", "B": "es", "C": "est", "D": "sont"},
    "A", "'je suis' = ich bin. 'être' ist ein unregelmäßiges Verb.",
    "tu es, il est, nous sommes, vous êtes, ils sont.",
    "Bildungsplan Französisch.", "'Je suis élève.'",
    "Konjugiere 'avoir' im Präsens.")
add("Französisch", "Zahlen", "leicht",
    "Was bedeutet 'quatre'?",
    {"A": "drei", "B": "vier", "C": "fünf", "D": "vierzig"},
    "B", "'quatre' ist die Zahl vier.",
    "un, deux, trois, quatre, cinq.",
    "Bildungsplan Französisch.", "'quatre heures' = vier Uhr.",
    "Wie heißt 'vierzig' auf Französisch?")
add("Französisch", "Landeskunde", "leicht",
    "Welche Stadt ist die Hauptstadt Frankreichs?",
    {"A": "Lyon", "B": "Paris", "C": "Marseille", "D": "Nizza"},
    "B", "Paris ist die Hauptstadt Frankreichs und liegt an der Seine.",
    "Wahrzeichen: Eiffelturm, Louvre.",
    "Bildungsplan Französisch.", "Paris, capitale de la France.",
    "Nenne drei französische Großstädte außer Paris.")
print("Latein + Französisch batch geladen")

# ---------------- GESCHICHTE ----------------
add("Geschichte", "Antike", "leicht",
    "Welches Volk errichtete das Kolosseum?",
    {"A": "die Griechen", "B": "die Römer", "C": "die Ägypter", "D": "die Perser"},
    "B", "Das Kolosseum (Amphitheater) wurde im 1. Jh. n. Chr. von den Römern erbaut.",
    "Es fasste bis zu 50.000 Zuschauer.",
    "Bildungsplan Geschichte.", "Eröffnet um 80 n. Chr. unter Titus.",
    "Wofür wurde das Kolosseum genutzt?")
add("Geschichte", "Mittelalter", "mittel",
    "Was war das zentrale Ordnungssystem der mittelalterlichen Gesellschaft?",
    {"A": "Demokratie", "B": "Lehnswesen (Feudalismus)", "C": "Kapitalismus", "D": "Sozialismus"},
    "B", "Das Lehnswesen regelte Rechte und Pflichten zwischen Lehnsherrn und Vasallen.",
    "Grundlage war die Vergabe von Land (Lehen) gegen Treue und Dienst.",
    "Bildungsplan Geschichte.", "König – Adel – Ritter – Bauern.",
    "Was bedeutete die Grundherrschaft für die Bauern?")
add("Geschichte", "Reformation", "mittel",
    "In welchem Jahr veröffentlichte Luther (traditionell) seine 95 Thesen?",
    {"A": "1492", "B": "1517", "C": "1618", "D": "1789"},
    "B", "1517 gilt als Beginn der Reformation (Thesenanschlag in Wittenberg).",
    "Anlass war u. a. der Ablasshandel.",
    "Bildungsplan Geschichte.", "31. Oktober 1517.",
    "Welche Folgen hatte die Reformation für Europa?")
add("Geschichte", "Französische Revolution", "mittel",
    "Mit welchem Ereignis beginnt die Französische Revolution 1789?",
    {"A": "Sturm auf die Bastille", "B": "Wiener Kongress", "C": "Königskrönung", "D": "Oktoberrevolution"},
    "A", "Der Sturm auf die Bastille am 14. Juli 1789 gilt als symbolischer Beginn.",
    "Leitideen: Freiheit, Gleichheit, Brüderlichkeit.",
    "Bildungsplan Geschichte.", "14. Juli ist französischer Nationalfeiertag.",
    "Was forderte die Erklärung der Menschen- und Bürgerrechte?")
add("Geschichte", "Industrialisierung", "mittel",
    "Welche Erfindung trieb die industrielle Revolution maßgeblich an?",
    {"A": "das Internet", "B": "die Dampfmaschine", "C": "das Auto", "D": "der Buchdruck"},
    "B", "Die von Watt verbesserte Dampfmaschine lieferte die Energie für Fabriken und Eisenbahn.",
    "Beginn in England im späten 18. Jahrhundert.",
    "Bildungsplan Geschichte.", "Eisenbahn ab 1830er Jahren.",
    "Welche sozialen Folgen hatte die Industrialisierung?")
add("Geschichte", "Erster Weltkrieg", "mittel",
    "Welches Ereignis löste 1914 den Ersten Weltkrieg unmittelbar aus?",
    {"A": "der Mauerfall", "B": "das Attentat von Sarajevo", "C": "Pearl Harbor", "D": "der Reichstagsbrand"},
    "B", "Die Ermordung des österreichischen Thronfolgers Franz Ferdinand in Sarajevo war der Auslöser.",
    "Tiefere Ursachen: Imperialismus, Bündnissysteme, Nationalismus.",
    "Bildungsplan Geschichte.", "28. Juni 1914.",
    "Was besagte die Kriegsschuldfrage im Versailler Vertrag?")
add("Geschichte", "Weimarer Republik", "schwer",
    "Welche Krise prägte Deutschland 1923 besonders?",
    {"A": "Hyperinflation", "B": "Ölkrise", "C": "Finanzkrise 2008", "D": "Pest"},
    "A", "1923 erreichte die Hyperinflation ihren Höhepunkt; Geld wurde praktisch wertlos.",
    "Stabilisierung durch die Rentenmark.",
    "Bildungsplan Geschichte.", "1 US-Dollar = Billionen Mark.",
    "Wie destabilisierte die Inflation die junge Demokratie?")
add("Geschichte", "Nationalsozialismus", "mittel",
    "In welchem Jahr kam Hitler als Reichskanzler an die Macht?",
    {"A": "1929", "B": "1933", "C": "1939", "D": "1945"},
    "B", "Am 30. Januar 1933 wurde Hitler zum Reichskanzler ernannt – Beginn der NS-Diktatur.",
    "Danach folgten Gleichschaltung und Ermächtigungsgesetz.",
    "Bildungsplan Geschichte.", "'Machtergreifung' 1933.",
    "Was bewirkte das Ermächtigungsgesetz?")
add("Geschichte", "Zweiter Weltkrieg", "mittel",
    "Mit welchem Überfall begann der Zweite Weltkrieg in Europa?",
    {"A": "Überfall auf Polen", "B": "Überfall auf Frankreich", "C": "Angriff auf die UdSSR", "D": "Pearl Harbor"},
    "A", "Der deutsche Überfall auf Polen am 1. September 1939 löste den Krieg aus.",
    "Großbritannien und Frankreich erklärten daraufhin den Krieg.",
    "Bildungsplan Geschichte.", "1. September 1939.",
    "Wann und wie endete der Krieg in Europa?")
add("Geschichte", "Holocaust", "schwer",
    "Was bezeichnet der Begriff 'Shoa'/'Holocaust'?",
    {"A": "einen Friedensvertrag", "B": "den Völkermord an den europäischen Juden", "C": "eine Schlacht", "D": "eine Währungsreform"},
    "B", "Der Holocaust bezeichnet den systematischen Massenmord an etwa sechs Millionen Juden durch das NS-Regime.",
    "Gedenken mahnt zur Wachsamkeit gegen Rassismus.",
    "Bildungsplan Geschichte.", "Konzentrations- und Vernichtungslager wie Auschwitz.",
    "Warum ist Erinnerungskultur heute wichtig?")
add("Geschichte", "Kalter Krieg", "mittel",
    "Welche beiden Supermächte standen sich im Kalten Krieg gegenüber?",
    {"A": "Deutschland und Frankreich", "B": "USA und UdSSR", "C": "China und Japan", "D": "England und Spanien"},
    "B", "Der Kalte Krieg war der Systemkonflikt zwischen USA (West) und Sowjetunion (Ost).",
    "Symbol der Teilung: die Berliner Mauer (1961–1989).",
    "Bildungsplan Geschichte.", "NATO vs. Warschauer Pakt.",
    "Was bedeutete das 'Gleichgewicht des Schreckens'?")
add("Geschichte", "Deutsche Teilung", "mittel",
    "In welchem Jahr fiel die Berliner Mauer?",
    {"A": "1961", "B": "1989", "C": "1990", "D": "1945"},
    "B", "Am 9. November 1989 fiel die Mauer; 1990 folgte die Wiedervereinigung.",
    "Friedliche Revolution in der DDR.",
    "Bildungsplan Geschichte.", "9. November 1989.",
    "Was führte zum Zusammenbruch der DDR?")
add("Geschichte", "Europäische Einigung", "mittel",
    "Woraus entstand die heutige Europäische Union ursprünglich?",
    {"A": "der NATO", "B": "der Montanunion (EGKS)", "C": "der UNO", "D": "dem Deutschen Bund"},
    "B", "Die Europäische Gemeinschaft für Kohle und Stahl (1951) war der Ausgangspunkt der Integration.",
    "Ziel war dauerhafter Frieden durch wirtschaftliche Verflechtung.",
    "Bildungsplan Geschichte/Gemeinschaftskunde.", "Römische Verträge 1957.",
    "Welche Ziele verfolgt die EU heute?")
print("Geschichte batch geladen")

# ============================================================
# Generatoren aus kuratierten Faktentabellen (reale Daten).
# Jede erzeugte Frage ist eine echte Prüfungsfrage mit korrekter
# Antwort und plausiblen Distraktoren aus derselben Tabelle.
# ============================================================

def _mk(subject, topic, difficulty, question, correct_text, distractors,
        idx, explanation, more_info, reference, example, open_question):
    """Baue eine 4-Optionen-Frage; Position der richtigen Antwort rotiert mit idx."""
    pos = idx % 4
    opts_texts = list(distractors[:3])
    opts_texts.insert(pos, correct_text)
    keys = ["A", "B", "C", "D"]
    options = {keys[i]: opts_texts[i] for i in range(4)}
    correct_key = keys[pos]
    add(subject, topic, difficulty, question, options, correct_key,
        explanation, more_info, reference, example, open_question)

def _others(value, pool, n=3):
    """Wähle n Distraktoren aus pool, die nicht gleich value sind (deterministisch)."""
    out = []
    for x in pool:
        if x != value and x not in out:
            out.append(x)
        if len(out) == n:
            break
    return out

# ---------------- GEOGRAPHIE: Hauptstädte ----------------
_capitals = [
    ("Deutschland", "Berlin"), ("Frankreich", "Paris"), ("Italien", "Rom"),
    ("Spanien", "Madrid"), ("Portugal", "Lissabon"), ("Großbritannien", "London"),
    ("Irland", "Dublin"), ("Niederlande", "Amsterdam"), ("Belgien", "Brüssel"),
    ("Luxemburg", "Luxemburg"), ("Schweiz", "Bern"), ("Österreich", "Wien"),
    ("Dänemark", "Kopenhagen"), ("Schweden", "Stockholm"), ("Norwegen", "Oslo"),
    ("Finnland", "Helsinki"), ("Polen", "Warschau"), ("Tschechien", "Prag"),
    ("Slowakei", "Bratislava"), ("Ungarn", "Budapest"), ("Rumänien", "Bukarest"),
    ("Bulgarien", "Sofia"), ("Griechenland", "Athen"), ("Kroatien", "Zagreb"),
    ("Slowenien", "Ljubljana"), ("Serbien", "Belgrad"), ("Russland", "Moskau"),
    ("Ukraine", "Kiew"), ("USA", "Washington, D.C."), ("Kanada", "Ottawa"),
    ("Mexiko", "Mexiko-Stadt"), ("Brasilien", "Brasília"), ("Argentinien", "Buenos Aires"),
    ("Chile", "Santiago de Chile"), ("Peru", "Lima"), ("China", "Peking"),
    ("Japan", "Tokio"), ("Indien", "Neu-Delhi"), ("Südkorea", "Seoul"),
    ("Thailand", "Bangkok"), ("Vietnam", "Hanoi"), ("Indonesien", "Jakarta"),
    ("Türkei", "Ankara"), ("Ägypten", "Kairo"), ("Marokko", "Rabat"),
    ("Südafrika", "Pretoria"), ("Nigeria", "Abuja"), ("Kenia", "Nairobi"),
    ("Australien", "Canberra"), ("Neuseeland", "Wellington"), ("Iran", "Teheran"),
    ("Irak", "Bagdad"), ("Saudi-Arabien", "Riad"), ("Israel", "Jerusalem"),
    ("Island", "Reykjavík"),
]
_cap_pool = [c for _, c in _capitals]
for i, (land, cap) in enumerate(_capitals):
    _mk("Geographie", "Hauptstädte", "leicht",
        f"Wie heißt die Hauptstadt von {land}?",
        cap, _others(cap, _cap_pool[i+1:] + _cap_pool[:i]),
        i,
        f"Die Hauptstadt von {land} ist {cap}.",
        "Hauptstädte sind häufig politische und kulturelle Zentren eines Staates.",
        "Diercke Weltatlas; Bildungsplan Geographie.",
        f"{land} – {cap}.",
        f"Nenne eine weitere große Stadt in {land}.")

# ---------------- GEOGRAPHIE: Flüsse, Gebirge, Allgemeines ----------------
_geo_facts = [
    ("Welcher ist der längste Fluss der Erde?", "Nil",
     ["Amazonas", "Jangtsekiang", "Mississippi"],
     "Der Nil gilt mit rund 6.650 km traditionell als längster Fluss der Erde (umstritten mit dem Amazonas)."),
    ("Welches ist das höchste Gebirge der Erde?", "Himalaya",
     ["Anden", "Alpen", "Rocky Mountains"],
     "Der Himalaya enthält mit dem Mount Everest (8.849 m) den höchsten Berg der Erde."),
    ("Welcher ist der größte Ozean?", "Pazifik",
     ["Atlantik", "Indischer Ozean", "Arktischer Ozean"],
     "Der Pazifik ist mit Abstand der größte und tiefste Ozean."),
    ("Welcher Kontinent ist der bevölkerungsreichste?", "Asien",
     ["Afrika", "Europa", "Nordamerika"],
     "In Asien leben über 60 % der Weltbevölkerung."),
    ("Welche Klimazone liegt direkt am Äquator?", "Tropen",
     ["Subtropen", "gemäßigte Zone", "Polarzone"],
     "Am Äquator herrscht das tropische Klima mit hohen Temperaturen das ganze Jahr."),
    ("Welcher Fluss fließt durch Paris?", "Seine",
     ["Loire", "Rhone", "Themse"],
     "Die Seine durchfließt Paris."),
    ("Welcher Fluss ist der längste Deutschlands?", "Rhein",
     ["Elbe", "Donau", "Main"],
     "Der Rhein ist (auf deutschem Gebiet) der längste Fluss Deutschlands."),
    ("Was misst man mit der Richterskala?", "Erdbebenstärke",
     ["Windgeschwindigkeit", "Niederschlag", "Luftdruck"],
     "Die Richterskala gibt die Magnitude (Stärke) von Erdbeben an."),
    ("Wie nennt man die gedachte Linie bei 0° Länge?", "Nullmeridian",
     ["Äquator", "Wendekreis", "Polarkreis"],
     "Der Nullmeridian (Greenwich) markiert 0° geographische Länge."),
    ("Welches Land hat die größte Fläche der Erde?", "Russland",
     ["Kanada", "China", "USA"],
     "Russland ist mit rund 17 Mio. km² das flächengrößte Land der Erde."),
    ("Welche Erdplattenbewegung verursacht Faltengebirge?", "Kollision zweier Platten",
     ["Auseinanderdriften", "Rotation", "Erosion"],
     "Beim Zusammenstoß kontinentaler Platten falten sich Gesteinsschichten zu Gebirgen auf."),
    ("Was beschreibt der Treibhauseffekt?", "Erwärmung durch Treibhausgase in der Atmosphäre",
     ["Abkühlung der Erde", "Ozonloch", "Vulkanismus"],
     "Treibhausgase wie CO₂ halten Wärmestrahlung zurück und erwärmen die Erde."),
]
for i, (q, correct, dist, expl) in enumerate(_geo_facts):
    _mk("Geographie", "Allgemeine Geographie", "mittel",
        q, correct, dist, i, expl,
        "Grundlagenwissen der physischen und thematischen Geographie.",
        "Diercke Weltatlas; Bildungsplan Geographie.",
        f"{q} → {correct}.",
        "Erläutere einen weiteren Aspekt dieses Themas.")

print("Geographie-Generatoren geladen")

# ---------------- CHEMIE: Elementsymbole ----------------
_elements = [
    ("Wasserstoff", "H"), ("Helium", "He"), ("Lithium", "Li"), ("Beryllium", "Be"),
    ("Bor", "B"), ("Kohlenstoff", "C"), ("Stickstoff", "N"), ("Sauerstoff", "O"),
    ("Fluor", "F"), ("Neon", "Ne"), ("Natrium", "Na"), ("Magnesium", "Mg"),
    ("Aluminium", "Al"), ("Silicium", "Si"), ("Phosphor", "P"), ("Schwefel", "S"),
    ("Chlor", "Cl"), ("Argon", "Ar"), ("Kalium", "K"), ("Calcium", "Ca"),
    ("Titan", "Ti"), ("Chrom", "Cr"), ("Mangan", "Mn"), ("Eisen", "Fe"),
    ("Kobalt", "Co"), ("Nickel", "Ni"), ("Kupfer", "Cu"), ("Zink", "Zn"),
    ("Brom", "Br"), ("Silber", "Ag"), ("Zinn", "Sn"), ("Iod", "I"),
    ("Barium", "Ba"), ("Platin", "Pt"), ("Gold", "Au"), ("Quecksilber", "Hg"),
    ("Blei", "Pb"), ("Uran", "U"), ("Wolfram", "W"), ("Helium (Edelgas)", "He"),
]
_sym_pool = [s for _, s in _elements]
for i, (name, sym) in enumerate(_elements):
    _mk("Chemie", "Elementsymbole", "leicht",
        f"Welches chemische Symbol hat das Element {name}?",
        sym, _others(sym, _sym_pool[i+1:] + _sym_pool[:i]),
        i,
        f"Das Elementsymbol für {name} ist '{sym}'.",
        "Elementsymbole leiten sich oft vom lateinischen Namen ab (z. B. Fe von ferrum).",
        "Periodensystem der Elemente (IUPAC).",
        f"{name} → {sym}.",
        f"In welcher Gruppe des Periodensystems steht {name}?")

# ---------------- PHYSIK: Größe – Einheit ----------------
_units = [
    ("Kraft", "Newton (N)"), ("Energie", "Joule (J)"), ("Leistung", "Watt (W)"),
    ("Druck", "Pascal (Pa)"), ("Frequenz", "Hertz (Hz)"), ("elektrische Spannung", "Volt (V)"),
    ("elektrische Stromstärke", "Ampere (A)"), ("elektrischer Widerstand", "Ohm (Ω)"),
    ("elektrische Ladung", "Coulomb (C)"), ("Temperatur", "Kelvin (K)"),
    ("elektrische Kapazität", "Farad (F)"), ("magnetische Flussdichte", "Tesla (T)"),
    ("Stoffmenge", "Mol (mol)"), ("Lichtstärke", "Candela (cd)"),
    ("Masse", "Kilogramm (kg)"), ("Länge", "Meter (m)"), ("Zeit", "Sekunde (s)"),
]
_unit_pool = [u for _, u in _units]
for i, (groesse, einheit) in enumerate(_units):
    _mk("Physik", "SI-Einheiten", "leicht",
        f"Welche SI-Einheit hat die physikalische Größe '{groesse}'?",
        einheit, _others(einheit, _unit_pool[i+1:] + _unit_pool[:i]),
        i,
        f"Die Größe '{groesse}' wird in {einheit} gemessen.",
        "Das SI-System definiert sieben Basiseinheiten; viele weitere sind abgeleitet.",
        "Gerthsen Physik; SI-Einheitensystem.",
        f"{groesse} – {einheit}.",
        f"Aus welchen Basiseinheiten setzt sich {einheit} zusammen?")

# ---------------- MATHEMATIK: Ableitungen von x^n ----------------
for n in range(2, 10):
    abl = f"{n}x^{n-1}" if n-1 > 1 else (f"{n}x" if n-1 == 1 else str(n))
    distract = [f"{n-1}x^{n-1}", f"x^{n-1}", f"{n}x^{n}"]
    _mk("Mathematik", "Ableitung Potenzfunktion", "leicht",
        f"Was ist die Ableitung von f(x) = x^{n}?",
        abl, distract, n,
        f"Nach der Potenzregel gilt (x^{n})' = {n}·x^{n-1} = {abl}.",
        "Potenzregel: (x^k)' = k·x^(k−1).",
        "Analysis Oberstufe.",
        f"(x^{n})' = {abl}.",
        "Wie lautet die Ableitung von x^n allgemein?")

# ---------------- MATHEMATIK: einfache Rechnungen ----------------
_calc = [
    ("Was ist 15 % von 200?", "30", ["20", "15", "45"]),
    ("Was ist der ggT von 12 und 18?", "6", ["2", "3", "12"]),
    ("Was ist das kgV von 4 und 6?", "12", ["24", "10", "6"]),
    ("Was ist 2⁵?", "32", ["16", "25", "64"]),
    ("Was ist √144?", "12", ["14", "72", "11"]),
    ("Wie viel Grad hat die Winkelsumme im Dreieck?", "180°", ["90°", "360°", "270°"]),
    ("Wie viel Grad hat die Winkelsumme im Viereck?", "360°", ["180°", "270°", "540°"]),
    ("Was ist 7!?", "5040", ["720", "49", "5050"]),
    ("Was ist log₁₀(1000)?", "3", ["2", "10", "100"]),
    ("Was ist 0,25 als Bruch?", "1/4", ["1/2", "2/5", "1/3"]),
    ("Was ist die Fakultät 0!?", "1", ["0", "undefiniert", "unendlich"]),
    ("Welchen Wert hat π gerundet auf zwei Nachkommastellen?", "3,14", ["3,41", "3,12", "2,71"]),
    ("Welchen Wert hat die Eulersche Zahl e (gerundet)?", "2,72", ["3,14", "1,62", "2,20"]),
]
for i, (q, correct, dist) in enumerate(_calc):
    _mk("Mathematik", "Grundrechnen & Konstanten", "leicht",
        q, correct, dist, i,
        f"{q} Ergebnis: {correct}.",
        "Grundlegende arithmetische und geometrische Zusammenhänge.",
        "Bildungsplan Mathematik Sekundarstufe I.",
        f"{q} → {correct}.",
        "Begründe dein Rechenergebnis.")

# ---------------- GESCHICHTE: Jahreszahlen ----------------
_dates = [
    ("die Entdeckung Amerikas durch Kolumbus", "1492", ["1453", "1517", "1588"]),
    ("der Beginn der Reformation (Luthers Thesen)", "1517", ["1492", "1555", "1618"]),
    ("der Beginn des Dreißigjährigen Krieges", "1618", ["1648", "1555", "1700"]),
    ("der Westfälische Frieden", "1648", ["1618", "1683", "1700"]),
    ("der Beginn der Französischen Revolution", "1789", ["1776", "1815", "1799"]),
    ("die Unabhängigkeitserklärung der USA", "1776", ["1789", "1812", "1763"]),
    ("der Wiener Kongress", "1815", ["1806", "1848", "1871"]),
    ("die Deutsche Revolution (Märzrevolution)", "1848", ["1815", "1871", "1830"]),
    ("die Reichsgründung des Deutschen Kaiserreichs", "1871", ["1848", "1888", "1866"]),
    ("der Beginn des Ersten Weltkriegs", "1914", ["1912", "1918", "1939"]),
    ("das Ende des Ersten Weltkriegs", "1918", ["1914", "1919", "1920"]),
    ("die Verabschiedung der Weimarer Verfassung", "1919", ["1918", "1923", "1933"]),
    ("Hitlers Ernennung zum Reichskanzler", "1933", ["1929", "1939", "1932"]),
    ("der Beginn des Zweiten Weltkriegs", "1939", ["1938", "1941", "1945"]),
    ("das Ende des Zweiten Weltkriegs in Europa", "1945", ["1944", "1946", "1949"]),
    ("die Gründung von BRD und DDR", "1949", ["1945", "1955", "1961"]),
    ("der Bau der Berliner Mauer", "1961", ["1949", "1953", "1968"]),
    ("der Fall der Berliner Mauer", "1989", ["1990", "1987", "1991"]),
    ("die deutsche Wiedervereinigung", "1990", ["1989", "1991", "1992"]),
    ("die Einführung des Euro-Bargeldes", "2002", ["1999", "2000", "2004"]),
]
for i, (ereignis, jahr, dist) in enumerate(_dates):
    _mk("Geschichte", "Jahreszahlen", "mittel",
        f"In welchem Jahr fand {ereignis} statt?",
        jahr, dist, i,
        f"{ereignis[0].upper()+ereignis[1:]} datiert auf das Jahr {jahr}.",
        "Schlüsseldaten der europäischen und deutschen Geschichte.",
        "Bildungsplan Geschichte Oberstufe.",
        f"{ereignis} – {jahr}.",
        "Welche Ursachen und Folgen hatte dieses Ereignis?")

print("Fakten-Generatoren Teil 2 geladen")

# ---------------- ENGLISCH: Vokabeln (Deutsch -> Englisch) ----------------
_en_vocab = [
    ("Haus", "house"), ("Baum", "tree"), ("Wasser", "water"), ("Feuer", "fire"),
    ("Freund", "friend"), ("Schule", "school"), ("Buch", "book"), ("Stadt", "city"),
    ("Land", "country"), ("Zeit", "time"), ("Jahr", "year"), ("Tag", "day"),
    ("Nacht", "night"), ("Licht", "light"), ("Welt", "world"), ("Kind", "child"),
    ("Frau", "woman"), ("Mann", "man"), ("Tier", "animal"), ("Vogel", "bird"),
    ("Fisch", "fish"), ("Pferd", "horse"), ("Hund", "dog"), ("Katze", "cat"),
    ("Sonne", "sun"), ("Mond", "moon"), ("Himmel", "sky"), ("Meer", "sea"),
    ("Berg", "mountain"), ("Straße", "street"), ("essen", "to eat"), ("trinken", "to drink"),
    ("laufen", "to run"), ("sprechen", "to speak"), ("schreiben", "to write"), ("lesen", "to read"),
    ("denken", "to think"), ("kaufen", "to buy"), ("verkaufen", "to sell"), ("arbeiten", "to work"),
    ("schlafen", "to sleep"), ("groß", "big"), ("klein", "small"), ("schnell", "fast"),
    ("langsam", "slow"), ("glücklich", "happy"), ("traurig", "sad"), ("schön", "beautiful"),
    ("hässlich", "ugly"), ("teuer", "expensive"), ("billig", "cheap"), ("stark", "strong"),
]
_en_pool = [e for _, e in _en_vocab]
for i, (de, en) in enumerate(_en_vocab):
    _mk("Englisch", "Vokabeln", "leicht",
        f"Wie heißt '{de}' auf Englisch?",
        en, _others(en, _en_pool[i+1:] + _en_pool[:i]),
        i,
        f"'{de}' heißt auf Englisch '{en}'.",
        "Ein breiter Grundwortschatz ist Basis für Hör- und Leseverstehen.",
        "Bildungsplan Englisch; Green Line / English G Vokabular.",
        f"{de} – {en}.",
        f"Bilde einen englischen Satz mit '{en}'.")

# ---------------- FRANZOESISCH: Vokabeln (Französisch -> Deutsch) ----------------
_fr_vocab = [
    ("la maison", "das Haus"), ("le chat", "die Katze"), ("le chien", "der Hund"),
    ("l'eau", "das Wasser"), ("le pain", "das Brot"), ("le livre", "das Buch"),
    ("l'école", "die Schule"), ("l'ami", "der Freund"), ("la ville", "die Stadt"),
    ("le jour", "der Tag"), ("la nuit", "die Nacht"), ("le soleil", "die Sonne"),
    ("la lune", "der Mond"), ("rouge", "rot"), ("bleu", "blau"), ("vert", "grün"),
    ("grand", "groß"), ("petit", "klein"), ("manger", "essen"), ("boire", "trinken"),
    ("parler", "sprechen"), ("écrire", "schreiben"), ("lire", "lesen"), ("acheter", "kaufen"),
    ("le temps", "die Zeit"), ("l'année", "das Jahr"), ("la mer", "das Meer"),
    ("la montagne", "der Berg"), ("l'oiseau", "der Vogel"), ("le poisson", "der Fisch"),
    ("heureux", "glücklich"), ("triste", "traurig"), ("beau", "schön"), ("rapide", "schnell"),
    ("la famille", "die Familie"),
]
_fr_pool = [d for _, d in _fr_vocab]
for i, (fr, de) in enumerate(_fr_vocab):
    _mk("Französisch", "Vokabeln", "leicht",
        f"Was bedeutet das französische Wort '{fr}'?",
        de, _others(de, _fr_pool[i+1:] + _fr_pool[:i]),
        i,
        f"'{fr}' bedeutet auf Deutsch '{de}'.",
        "Artikel und Genus sollten stets mitgelernt werden.",
        "Bildungsplan Französisch; À plus / Découvertes.",
        f"{fr} – {de}.",
        f"Bilde einen französischen Satz mit '{fr}'.")

# ---------------- LATEIN: Vokabeln (Latein -> Deutsch) ----------------
_la_vocab = [
    ("aqua", "Wasser"), ("terra", "Erde"), ("vita", "Leben"), ("mors", "Tod"),
    ("amor", "Liebe"), ("pax", "Frieden"), ("rex", "König"), ("deus", "Gott"),
    ("homo", "Mensch"), ("puer", "Junge"), ("puella", "Mädchen"), ("liber", "Buch"),
    ("bonus", "gut"), ("malus", "schlecht"), ("magnus", "groß"), ("parvus", "klein"),
    ("videre", "sehen"), ("audire", "hören"), ("amare", "lieben"), ("dicere", "sagen"),
    ("facere", "machen"), ("urbs", "Stadt"), ("populus", "Volk"), ("senatus", "Senat"),
    ("tempus", "Zeit"), ("dies", "Tag"), ("nox", "Nacht"), ("sol", "Sonne"),
    ("ager", "Acker"), ("miles", "Soldat"), ("gladius", "Schwert"), ("navis", "Schiff"),
    ("dominus", "Herr"), ("servus", "Sklave"), ("virtus", "Tugend"),
]
_la_pool = [d for _, d in _la_vocab]
for i, (la, de) in enumerate(_la_vocab):
    _mk("Latein", "Vokabeln", "leicht",
        f"Was bedeutet das lateinische Wort '{la}'?",
        de, _others(de, _la_pool[i+1:] + _la_pool[:i]),
        i,
        f"'{la}' bedeutet auf Deutsch '{de}'.",
        "Der lateinische Grundwortschatz hilft auch beim Erschließen von Fremdwörtern.",
        "Bildungsplan Latein; Campus / Cursus Vokabular.",
        f"{la} – {de}.",
        f"Welches Fremdwort leitet sich von '{la}' ab?")

print("Vokabel-Generatoren geladen")

def fact_block(subject, topic, difficulty, items, more_info, reference,
               open_q="Begründe deine Antwort und nenne ein Beispiel."):
    for i, (q, correct, dist, expl) in enumerate(items):
        _mk(subject, topic, difficulty, q, correct, dist, i, expl,
            more_info, reference, f"{q} → {correct}.", open_q)

# ---------------- POLITIK / GEMEINSCHAFTSKUNDE ----------------
fact_block("Politik", "Politisches System Deutschlands", "mittel", [
    ("Welche Staatsform hat Deutschland?", "parlamentarische Demokratie",
     ["absolute Monarchie", "Diktatur", "direkte Demokratie"],
     "Deutschland ist eine parlamentarische Demokratie und ein föderaler Bundesstaat."),
    ("Wie heißt die deutsche Verfassung?", "Grundgesetz",
     ["Reichsverfassung", "Bürgerliches Gesetzbuch", "Strafgesetzbuch"],
     "Das Grundgesetz (seit 1949) ist die Verfassung der Bundesrepublik."),
    ("Wer ist das deutsche Staatsoberhaupt?", "der Bundespräsident",
     ["der Bundeskanzler", "der Bundestagspräsident", "der König"],
     "Der Bundespräsident repräsentiert den Staat; der Kanzler führt die Regierung."),
    ("Wer leitet die Bundesregierung?", "der Bundeskanzler",
     ["der Bundespräsident", "der Bundesratspräsident", "der Richter"],
     "Der Bundeskanzler bestimmt die Richtlinien der Politik (Richtlinienkompetenz)."),
    ("Wie viele Bundesländer hat Deutschland?", "16",
     ["12", "14", "18"],
     "Deutschland besteht aus 16 Bundesländern."),
    ("Wo hat das Bundesverfassungsgericht seinen Sitz?", "Karlsruhe",
     ["Berlin", "München", "Leipzig"],
     "Das Bundesverfassungsgericht in Karlsruhe wacht über die Einhaltung des Grundgesetzes."),
    ("Was regelt Artikel 1 des Grundgesetzes?", "die Würde des Menschen",
     ["die Pressefreiheit", "das Wahlrecht", "den Umweltschutz"],
     "'Die Würde des Menschen ist unantastbar' ist das zentrale Grundrecht."),
    ("Welche drei Gewalten unterscheidet die Gewaltenteilung?", "Legislative, Exekutive, Judikative",
     ["Partei, Presse, Volk", "Bund, Land, Kommune", "Kirche, Staat, Wirtschaft"],
     "Gesetzgebung, ausführende Gewalt und Rechtsprechung kontrollieren sich gegenseitig."),
    ("Ab welchem Alter darf man bei Bundestagswahlen wählen?", "18 Jahre",
     ["16 Jahre", "21 Jahre", "14 Jahre"],
     "Das aktive Wahlrecht zum Bundestag beginnt mit 18 Jahren."),
    ("Welche Kammer vertritt die Bundesländer im Gesetzgebungsprozess?", "der Bundesrat",
     ["der Bundestag", "das Europaparlament", "der Bundespräsident"],
     "Der Bundesrat vertritt die Länder und wirkt an der Gesetzgebung mit."),
], "Grundwissen zum politischen System der Bundesrepublik Deutschland.",
   "Grundgesetz; Bildungsplan Gemeinschaftskunde/Politik.")

# ---------------- WIRTSCHAFT ----------------
fact_block("Wirtschaft", "Volkswirtschaft", "mittel", [
    ("Wodurch bildet sich in der Marktwirtschaft der Preis?", "durch Angebot und Nachfrage",
     ["durch den Staat", "durch die Kirche", "durch Zufall"],
     "Im Marktgleichgewicht treffen sich Angebots- und Nachfragekurve."),
    ("Was bezeichnet der Begriff Inflation?", "anhaltender Anstieg des Preisniveaus",
     ["Sinken der Preise", "Arbeitslosigkeit", "Steuererhöhung"],
     "Inflation mindert die Kaufkraft des Geldes."),
    ("Wofür steht die Abkürzung BIP?", "Bruttoinlandsprodukt",
     ["Brutto-Investitions-Plan", "Bank-Internationaler-Posten", "Bürger-Informations-Portal"],
     "Das BIP misst den Wert aller im Inland erzeugten Waren und Dienstleistungen."),
    ("Wer gilt als Begründer der Sozialen Marktwirtschaft in Deutschland?", "Ludwig Erhard",
     ["Karl Marx", "Konrad Adenauer", "Adam Smith"],
     "Ludwig Erhard prägte das Konzept der Sozialen Marktwirtschaft."),
    ("Welche Institution gibt den Euro heraus bzw. steuert ihn?", "die Europäische Zentralbank",
     ["die Weltbank", "der IWF", "die Bundesbank allein"],
     "Die EZB ist für die Geldpolitik im Euroraum zuständig."),
    ("Was versteht man unter Opportunitätskosten?", "entgangener Nutzen der nächstbesten Alternative",
     ["Steuern", "Fixkosten", "Transportkosten"],
     "Jede Entscheidung bedeutet den Verzicht auf die beste Alternative."),
    ("Was beschreibt das ökonomische Prinzip (Minimalprinzip)?", "ein Ziel mit möglichst geringem Mitteleinsatz erreichen",
     ["möglichst viel Geld drucken", "immer sparen", "keine Entscheidungen treffen"],
     "Das Minimalprinzip strebt ein festes Ziel mit minimalem Aufwand an."),
    ("Was ist ein Oligopol?", "ein Markt mit wenigen großen Anbietern",
     ["ein Markt mit einem Anbieter", "ein Markt ohne Anbieter", "ein Markt mit sehr vielen Anbietern"],
     "Beim Oligopol teilen sich wenige Anbieter den Markt; Monopol = ein Anbieter."),
], "Grundbegriffe der Volkswirtschaftslehre.",
   "Bildungsplan Wirtschaft/Gemeinschaftskunde.")

# ---------------- RELIGION ----------------
fact_block("Religion", "Weltreligionen", "leicht", [
    ("Welche heilige Schrift gehört zum Islam?", "der Koran",
     ["die Bibel", "die Tora", "die Veden"],
     "Der Koran gilt im Islam als offenbartes Wort Gottes."),
    ("Welche heilige Schrift ist zentral im Judentum?", "die Tora",
     ["der Koran", "das Neue Testament", "der Tripitaka"],
     "Die Tora umfasst die fünf Bücher Mose."),
    ("Wer gilt als Stifter des Christentums?", "Jesus von Nazareth",
     ["Mohammed", "Buddha", "Abraham"],
     "Das Christentum geht auf Leben und Botschaft Jesu zurück."),
    ("Wer gilt als Prophet und Stifter des Islam?", "Mohammed",
     ["Jesus", "Moses", "Buddha"],
     "Mohammed verkündete nach islamischem Glauben die Offenbarung Gottes."),
    ("Welches christliche Fest feiert die Auferstehung Jesu?", "Ostern",
     ["Weihnachten", "Pfingsten", "Erntedank"],
     "Ostern ist das höchste christliche Fest."),
    ("Welches Fest feiert die Geburt Jesu?", "Weihnachten",
     ["Ostern", "Pfingsten", "Fronleichnam"],
     "Weihnachten erinnert an die Geburt Jesu."),
    ("Wie viele Gebote erhielt Mose nach biblischer Überlieferung?", "zehn",
     ["sieben", "fünf", "zwölf"],
     "Die Zehn Gebote sind ethische Grundregeln in Judentum und Christentum."),
    ("Welche Stadt ist der wichtigste Pilgerort des Islam?", "Mekka",
     ["Jerusalem", "Rom", "Varanasi"],
     "Jeder Muslim soll einmal im Leben nach Mekka pilgern (Hadsch)."),
    ("Was bezeichnet der Begriff Monotheismus?", "den Glauben an einen einzigen Gott",
     ["den Glauben an viele Götter", "den Unglauben", "die Naturverehrung"],
     "Judentum, Christentum und Islam sind monotheistische Religionen."),
    ("Wer ist der Stifter des Buddhismus?", "Siddhartha Gautama (Buddha)",
     ["Konfuzius", "Laotse", "Mohammed"],
     "Der historische Buddha lehrte den Weg zur Überwindung des Leidens."),
], "Überblick über die großen Weltreligionen.",
   "Bildungsplan Religion/Ethik.")

# ---------------- ETHIK / PHILOSOPHIE ----------------
fact_block("Ethik/Philosophie", "Philosophie", "schwer", [
    ("Wer formulierte den kategorischen Imperativ?", "Immanuel Kant",
     ["Platon", "Nietzsche", "Descartes"],
     "Kants kategorischer Imperativ ist ein unbedingtes Sittengesetz der Vernunft."),
    ("Von wem stammt der Satz 'Ich denke, also bin ich' (cogito ergo sum)?", "René Descartes",
     ["Sokrates", "Aristoteles", "Kant"],
     "Descartes suchte im Zweifel einen unbezweifelbaren Ausgangspunkt."),
    ("Wer verfasste das Höhlengleichnis?", "Platon",
     ["Aristoteles", "Sokrates", "Epikur"],
     "Platons Höhlengleichnis veranschaulicht seine Ideenlehre."),
    ("Welche ethische Position misst Handlungen am größtmöglichen Glück der meisten?", "Utilitarismus",
     ["Pflichtethik", "Tugendethik", "Nihilismus"],
     "Der Utilitarismus (Bentham, Mill) bewertet Folgen nach Nutzen/Glück."),
    ("Wer gilt als Lehrer Platons und prägte die Frage-Methode?", "Sokrates",
     ["Aristoteles", "Thales", "Seneca"],
     "Die sokratische Methode (Maiêutik) führt durch Fragen zur Einsicht."),
    ("Wer war Schüler Platons und Begründer der formalen Logik?", "Aristoteles",
     ["Pythagoras", "Heraklit", "Descartes"],
     "Aristoteles systematisierte Logik und schrieb die Nikomachische Ethik."),
    ("Welche ethische Richtung orientiert sich an Pflicht und Gesinnung?", "Deontologie (Pflichtethik)",
     ["Utilitarismus", "Hedonismus", "Relativismus"],
     "Die deontologische Ethik bewertet Handlungen nach ihrer Pflichtgemäßheit."),
    ("Wer prägte den Gedanken des 'Übermenschen'?", "Friedrich Nietzsche",
     ["Marx", "Kant", "Hegel"],
     "Nietzsche entwarf den Übermenschen als Ideal der Selbstüberwindung."),
], "Zentrale Denker und Konzepte der Philosophiegeschichte.",
   "Bildungsplan Ethik/Philosophie Oberstufe.")

print("Politik/Wirtschaft/Religion/Philosophie geladen")

# ---------------- MUSIK ----------------
fact_block("Musik", "Musiklehre & Komponisten", "leicht", [
    ("Was bedeutet die Vortragsbezeichnung 'forte'?", "laut",
     ["leise", "schnell", "langsam"], "'forte' (f) bedeutet laut."),
    ("Was bedeutet 'piano' als Dynamikangabe?", "leise",
     ["laut", "sehr schnell", "gebunden"], "'piano' (p) bedeutet leise."),
    ("Was bedeutet 'crescendo'?", "allmählich lauter werden",
     ["leiser werden", "schneller werden", "pausieren"], "Ein crescendo steigert die Lautstärke."),
    ("Was bedeutet das Tempo 'adagio'?", "langsam",
     ["sehr schnell", "laut", "gebunden"], "'adagio' ist ein langsames Tempo."),
    ("Was bedeutet 'allegro'?", "schnell, lebhaft",
     ["langsam", "leise", "traurig"], "'allegro' bezeichnet ein schnelles, heiteres Tempo."),
    ("Wie nennt man eine gebundene, fließende Spielweise?", "legato",
     ["staccato", "forte", "ritardando"], "legato = Töne ohne Absetzen verbinden."),
    ("Aus wie vielen Halbtonschritten besteht eine Oktave?", "zwölf",
     ["acht", "sieben", "zehn"], "Die chromatische Oktave umfasst zwölf Halbtonschritte."),
    ("Wie viele Linien hat ein Notensystem?", "fünf",
     ["vier", "sechs", "drei"], "Das Notensystem besteht aus fünf Linien."),
    ("Welches Tongeschlecht klingt meist 'fröhlich'?", "Dur",
     ["Moll", "chromatisch", "atonal"], "Dur wird oft als hell/fröhlich, Moll als dunkel empfunden."),
    ("Wer komponierte die Oper 'Die Zauberflöte'?", "Wolfgang Amadeus Mozart",
     ["Ludwig van Beethoven", "Johann Sebastian Bach", "Richard Wagner"],
     "Mozarts 'Zauberflöte' wurde 1791 urauffgeführt."),
    ("Wer komponierte die 9. Sinfonie mit der 'Ode an die Freude'?", "Ludwig van Beethoven",
     ["Mozart", "Haydn", "Brahms"], "Das Thema ist heute die Europahymne."),
    ("Wer komponierte 'Die vier Jahreszeiten'?", "Antonio Vivaldi",
     ["Bach", "Händel", "Chopin"], "Vivaldis Violinkonzerte sind Programmmusik des Barock."),
], "Grundlagen der Musiklehre und bedeutende Komponisten.",
   "Bildungsplan Musik.")

# ---------------- KUNST ----------------
fact_block("Kunst", "Kunstgeschichte & Farbenlehre", "leicht", [
    ("Welche drei Farben sind die Primärfarben?", "Rot, Gelb, Blau",
     ["Rot, Grün, Blau", "Schwarz, Weiß, Grau", "Orange, Grün, Violett"],
     "Aus den Primärfarben lassen sich alle weiteren Farben mischen."),
    ("Wie nennt man Farben, die sich im Farbkreis gegenüberliegen?", "Komplementärfarben",
     ["Primärfarben", "Pastellfarben", "Erdfarben"],
     "Komplementärfarben verstärken sich im Kontrast (z. B. Rot/Grün)."),
    ("Wer malte die 'Mona Lisa'?", "Leonardo da Vinci",
     ["Michelangelo", "Raffael", "Vincent van Gogh"],
     "Die 'Mona Lisa' hängt im Louvre in Paris."),
    ("Wer schuf die Deckenfresken der Sixtinischen Kapelle?", "Michelangelo",
     ["Leonardo da Vinci", "Rembrandt", "Dürer"],
     "Michelangelo bemalte die Decke zwischen 1508 und 1512."),
    ("Welche Maltechnik bezeichnet Malerei auf frischem Kalkputz?", "Fresko",
     ["Aquarell", "Ölmalerei", "Collage"],
     "Beim Fresko verbindet sich die Farbe dauerhaft mit dem trocknenden Putz."),
    ("Welche Kunstrichtung ist mit Claude Monet verbunden?", "Impressionismus",
     ["Kubismus", "Barock", "Surrealismus"],
     "Der Impressionismus fing Lichtstimmungen in schnellen Pinselstrichen ein."),
    ("Welcher Künstler gilt als Mitbegründer des Kubismus?", "Pablo Picasso",
     ["Monet", "Dalí", "Rembrandt"],
     "Picasso und Braque zerlegten Gegenstände in geometrische Formen."),
    ("Welche Perspektive erzeugt räumliche Tiefe mit einem Fluchtpunkt?", "Zentralperspektive",
     ["Vogelperspektive allein", "Farbperspektive allein", "keine"],
     "In der Zentralperspektive laufen Linien in einem Fluchtpunkt zusammen."),
], "Grundbegriffe der Farbenlehre und der Kunstgeschichte.",
   "Bildungsplan Bildende Kunst.")

# ---------------- SPORT ----------------
fact_block("Sport", "Sporttheorie", "leicht", [
    ("Wie viele Spieler einer Mannschaft stehen beim Fußball gleichzeitig auf dem Feld?", "elf",
     ["zehn", "zwölf", "neun"], "Eine Fußballmannschaft besteht aus 10 Feldspielern und einem Torwart."),
    ("Wie lang ist ein Marathonlauf?", "42,195 km",
     ["21,1 km", "50 km", "40 km"], "Die klassische Marathondistanz beträgt 42,195 Kilometer."),
    ("Wie viele Ringe hat das olympische Symbol?", "fünf",
     ["vier", "sechs", "drei"], "Die fünf Ringe stehen für die fünf Kontinente."),
    ("Welches System trainiert vor allem Ausdauertraining?", "das Herz-Kreislauf-System",
     ["nur die Knochen", "das Nervensystem allein", "die Haut"],
     "Ausdauertraining stärkt Herz, Lunge und Blutkreislauf."),
    ("Wie viele Spieler stehen beim Volleyball pro Team auf dem Feld?", "sechs",
     ["fünf", "sieben", "elf"], "Beim Volleyball spielen sechs gegen sechs."),
    ("Was bewirkt regelmäßiges Dehnen vor allem?", "Verbesserung der Beweglichkeit",
     ["Muskelabbau", "Gewichtszunahme", "Hörverbesserung"],
     "Dehnen fördert Flexibilität und kann Verletzungen vorbeugen."),
    ("Welcher Energieträger wird bei kurzer, intensiver Belastung zuerst genutzt?", "ATP/Kreatinphosphat",
     ["Fett", "Eiweiß", "Vitamine"], "Für sehr kurze Maximalleistung dienen die energiereichen Phosphate."),
], "Grundlagen aus Sporttheorie und Trainingslehre.",
   "Bildungsplan Sport.")

# ---------------- BIOLOGIE (Erweiterung) ----------------
fact_block("Biologie", "Grundbegriffe", "mittel", [
    ("Welches Molekül trägt die Erbinformation?", "DNA",
     ["ATP", "Glucose", "Hämoglobin"], "Die DNA speichert die genetische Information in Basenabfolgen."),
    ("Welcher Farbstoff ermöglicht die Fotosynthese?", "Chlorophyll",
     ["Hämoglobin", "Melanin", "Karotin"], "Chlorophyll absorbiert Licht in den Chloroplasten."),
    ("Was ist Osmose?", "Diffusion von Wasser durch eine semipermeable Membran",
     ["aktiver Transport von Zucker", "Zellteilung", "Atmung"],
     "Wasser wandert zum Ort höherer Teilchenkonzentration."),
    ("Wie nennt man Biokatalysatoren im Körper?", "Enzyme",
     ["Hormone", "Vitamine", "Antikörper"], "Enzyme beschleunigen Stoffwechselreaktionen."),
    ("An welchem Organell werden Proteine hergestellt?", "am Ribosom",
     ["am Zellkern", "an der Vakuole", "am Golgi-Apparat"], "Ribosomen übersetzen mRNA in Proteine."),
    ("Welche Blutzellen transportieren Sauerstoff?", "rote Blutkörperchen (Erythrozyten)",
     ["weiße Blutkörperchen", "Blutplättchen", "Nervenzellen"],
     "Erythrozyten enthalten Hämoglobin, das Sauerstoff bindet."),
    ("Welches Hormon senkt den Blutzuckerspiegel?", "Insulin",
     ["Adrenalin", "Testosteron", "Thyroxin"], "Insulin aus der Bauchspeicheldrüse senkt den Blutzucker."),
    ("Wie viele Beine haben Insekten?", "sechs",
     ["acht", "vier", "zehn"], "Insekten haben sechs Beine; Spinnen (keine Insekten) acht."),
    ("Was beschreibt eine Symbiose?", "Zusammenleben zum gegenseitigen Nutzen",
     ["Fressen eines Tieres", "Krankheit", "Konkurrenz"], "Beide Partner profitieren voneinander."),
    ("Wozu dient die Mitose?", "zur identischen Vermehrung von Körperzellen",
     ["zur Bildung von Keimzellen", "zur Verdauung", "zur Atmung"],
     "Die Mitose erzeugt zwei genetisch identische Tochterzellen."),
], "Zentrale Begriffe der Zell- und Humanbiologie.",
   "Bildungsplan Biologie.")

print("Musik/Kunst/Sport/Biologie-Erweiterung geladen")

# ---------------- DEUTSCH: Autor -> Werk ----------------
_works = [
    ("Faust", "Johann Wolfgang von Goethe"), ("Die Räuber", "Friedrich Schiller"),
    ("Woyzeck", "Georg Büchner"), ("Der Prozess", "Franz Kafka"),
    ("Die Verwandlung", "Franz Kafka"), ("Effi Briest", "Theodor Fontane"),
    ("Buddenbrooks", "Thomas Mann"), ("Der Steppenwolf", "Hermann Hesse"),
    ("Die Blechtrommel", "Günter Grass"), ("Nathan der Weise", "Gotthold Ephraim Lessing"),
    ("Maria Stuart", "Friedrich Schiller"), ("Emilia Galotti", "Gotthold Ephraim Lessing"),
    ("Der zerbrochne Krug", "Heinrich von Kleist"), ("Die Physiker", "Friedrich Dürrenmatt"),
    ("Homo faber", "Max Frisch"), ("Im Westen nichts Neues", "Erich Maria Remarque"),
]
_authors = sorted(set(a for _, a in _works))
for i, (werk, autor) in enumerate(_works):
    _mk("Deutsch", "Autoren und Werke", "mittel",
        f"Von wem stammt das Werk '{werk}'?",
        autor, _others(autor, _authors[(_authors.index(autor)+1):] + _authors[:_authors.index(autor)]),
        i,
        f"'{werk}' stammt von {autor}.",
        "Kenntnis zentraler Werke der deutschen Literatur ist Abiturwissen.",
        "Bildungsplan Deutsch Oberstufe.",
        f"{werk} – {autor}.",
        f"Ordne '{werk}' einer Literaturepoche zu.")

# ---------------- DEUTSCH: Rhetorische Mittel & Grammatik ----------------
fact_block("Deutsch", "Rhetorische Mittel", "mittel", [
    ("Wie nennt man die Wiederholung gleicher Anfangswörter in aufeinanderfolgenden Sätzen?", "Anapher",
     ["Alliteration", "Metapher", "Ellipse"], "Die Anapher wiederholt Wörter am Satz-/Versanfang."),
    ("Wie heißt die Wiederholung gleicher Anfangslaute (z. B. 'Milch macht müde Männer munter')?", "Alliteration",
     ["Anapher", "Ironie", "Hyperbel"], "Die Alliteration nutzt gleiche Anlaute."),
    ("Welches Stilmittel bezeichnet eine starke Übertreibung?", "Hyperbel",
     ["Litotes", "Metonymie", "Vergleich"], "Die Hyperbel übertreibt bewusst ('tausend Dank')."),
    ("Wie nennt man die Vermenschlichung von Dingen oder Natur?", "Personifikation",
     ["Metapher", "Symbol", "Allegorie"], "Die Personifikation verleiht Unbelebtem menschliche Züge."),
    ("Was ist ein Oxymoron?", "Verbindung zweier widersprüchlicher Begriffe",
     ["eine Übertreibung", "ein Vergleich", "eine Wiederholung"], "Beispiel: 'beredtes Schweigen'."),
    ("Wie nennt man eine Frage, die keine Antwort erwartet?", "rhetorische Frage",
     ["Ellipse", "Anapher", "Parenthese"], "Die rhetorische Frage dient der Überzeugung."),
    ("Was ist ein Euphemismus?", "eine beschönigende Umschreibung",
     ["eine Übertreibung", "ein Fluch", "ein Vergleich"], "Beispiel: 'entschlafen' statt 'sterben'."),
], "Häufige rhetorische Stilmittel der Textanalyse.",
   "Bildungsplan Deutsch.")

fact_block("Deutsch", "Grammatik – Wortarten & Zeiten", "leicht", [
    ("Zu welcher Wortart gehört 'schnell' in 'ein schnelles Auto'?", "Adjektiv",
     ["Adverb", "Nomen", "Verb"], "Als Attribut beschreibt das Adjektiv ein Nomen."),
    ("Welche Wortart ist 'und'?", "Konjunktion",
     ["Präposition", "Pronomen", "Adverb"], "Konjunktionen verbinden Wörter oder Sätze."),
    ("Welche Wortart ist 'auf' in 'auf dem Tisch'?", "Präposition",
     ["Konjunktion", "Adverb", "Artikel"], "Präpositionen geben Verhältnisse (Ort, Zeit) an."),
    ("In welcher Zeitform steht 'Ich hatte gegessen'?", "Plusquamperfekt",
     ["Perfekt", "Präteritum", "Futur I"], "Das Plusquamperfekt drückt Vorzeitigkeit in der Vergangenheit aus."),
    ("Welcher Modus wird für die indirekte Rede verwendet?", "Konjunktiv I",
     ["Konjunktiv II", "Indikativ", "Imperativ"], "Der Konjunktiv I kennzeichnet wiedergegebene Aussagen."),
    ("Wie nennt man die Satzform 'Das Haus wird gebaut'?", "Passiv",
     ["Aktiv", "Imperativ", "Konjunktiv"], "Im Passiv steht der Handlungsgegenstand im Vordergrund."),
], "Grundlagen der deutschen Grammatik.",
   "Bildungsplan Deutsch Sekundarstufe I.")

# ---------------- ENGLISCH: unregelmäßige Verben (Simple Past) ----------------
_irregular = [
    ("go", "went"), ("see", "saw"), ("do", "did"), ("have", "had"), ("take", "took"),
    ("make", "made"), ("come", "came"), ("give", "gave"), ("get", "got"), ("find", "found"),
    ("think", "thought"), ("buy", "bought"), ("bring", "brought"), ("teach", "taught"),
    ("catch", "caught"), ("eat", "ate"), ("drink", "drank"), ("swim", "swam"), ("run", "ran"),
    ("write", "wrote"), ("speak", "spoke"), ("break", "broke"), ("choose", "chose"),
    ("drive", "drove"), ("fly", "flew"), ("know", "knew"), ("grow", "grew"), ("throw", "threw"),
    ("begin", "began"), ("sing", "sang"), ("sit", "sat"), ("stand", "stood"), ("win", "won"),
    ("sell", "sold"), ("tell", "told"), ("feel", "felt"), ("keep", "kept"), ("leave", "left"),
    ("meet", "met"), ("sleep", "slept"),
]
_past_pool = [p for _, p in _irregular]
for i, (base, past) in enumerate(_irregular):
    _mk("Englisch", "Unregelmäßige Verben", "mittel",
        f"Wie lautet die Simple-Past-Form von '{base}'?",
        past, _others(past, _past_pool[i+1:] + _past_pool[:i]),
        i,
        f"Das Simple Past von '{base}' ist '{past}'.",
        "Unregelmäßige Verben bilden das Past nicht mit -ed.",
        "Bildungsplan Englisch; Liste der irregular verbs.",
        f"{base} – {past}.",
        f"Wie lautet das Past Participle (3. Form) von '{base}'?")

print("Deutsch-Erweiterung + Englisch-Verben geladen")

# ---------------- MATHEMATIK: Formeln & Integrale ----------------
fact_block("Mathematik", "Geometrische Formeln", "mittel", [
    ("Wie berechnet man den Umfang eines Kreises mit Radius r?", "2πr",
     ["πr²", "πr", "4πr"], "Der Kreisumfang ist U = 2πr."),
    ("Wie berechnet man die Fläche eines Dreiecks?", "(Grundseite × Höhe) / 2",
     ["Grundseite × Höhe", "Seite²", "πr²"], "A = (g·h)/2."),
    ("Wie berechnet man das Volumen eines Würfels mit Kantenlänge a?", "a³",
     ["a²", "6a²", "3a"], "Das Würfelvolumen ist a³; die Oberfläche 6a²."),
    ("Wie berechnet man das Volumen eines Zylinders?", "πr²h",
     ["2πrh", "πr²", "(4/3)πr³"], "V = Grundfläche × Höhe = πr²h."),
    ("Wie groß ist die Winkelsumme in einem n-Eck?", "(n−2)·180°",
     ["n·180°", "360°", "(n−1)·90°"], "Jedes n-Eck lässt sich in n−2 Dreiecke zerlegen."),
    ("Was besagt der Satz des Thales?", "Der Winkel im Halbkreis ist ein rechter Winkel",
     ["a²+b²=c²", "Die Winkelsumme ist 180°", "Parallelen schneiden sich nie"],
     "Liegt ein Dreieckspunkt auf dem Halbkreis über der Hypotenuse, ist der Winkel 90°."),
    ("Wie lautet die erste binomische Formel?", "(a+b)² = a² + 2ab + b²",
     ["(a+b)² = a² + b²", "(a−b)² = a² − b²", "(a+b)² = 2a + 2b"],
     "Die binomischen Formeln erleichtern das Ausmultiplizieren."),
    ("Wie berechnet man die Steigung m einer Geraden?", "m = Δy / Δx",
     ["m = Δx / Δy", "m = y·x", "m = y + x"], "Die Steigung ist das Verhältnis von Höhen- zu Breitenzuwachs."),
], "Wichtige Formeln der Geometrie und Algebra.",
   "Formelsammlung Mathematik.")

fact_block("Mathematik", "Integrale", "schwer", [
    ("Was ist ∫ x dx?", "x²/2 + C", ["x² + C", "1 + C", "2x + C"], "Stammfunktion von x ist x²/2."),
    ("Was ist ∫ x² dx?", "x³/3 + C", ["2x + C", "x³ + C", "3x² + C"], "Stammfunktion von x² ist x³/3."),
    ("Was ist ∫ e^x dx?", "e^x + C", ["x·e^x + C", "e^(x+1) + C", "ln x + C"], "Die e-Funktion ist ihre eigene Stammfunktion."),
    ("Was ist ∫ (1/x) dx?", "ln|x| + C", ["x⁻² + C", "1/x² + C", "e^x + C"], "Stammfunktion von 1/x ist der natürliche Logarithmus."),
    ("Was ist ∫ sin x dx?", "−cos x + C", ["cos x + C", "sin x + C", "−sin x + C"], "Stammfunktion von sin x ist −cos x."),
    ("Was ist ∫ cos x dx?", "sin x + C", ["−sin x + C", "cos x + C", "tan x + C"], "Stammfunktion von cos x ist sin x."),
], "Grundintegrale der Analysis.",
   "Analysis Oberstufe.")

fact_block("Mathematik", "Stochastik-Grundlagen", "mittel", [
    ("Wie berechnet man die Wahrscheinlichkeit des Gegenereignisses von A?", "1 − P(A)",
     ["P(A)²", "1 + P(A)", "P(A)/2"], "Die Summe von Ereignis und Gegenereignis ist 1."),
    ("Wann sind zwei Ereignisse A und B stochastisch unabhängig?", "wenn P(A∩B) = P(A)·P(B)",
     ["wenn P(A)=P(B)", "wenn sie sich ausschließen", "immer"], "Dann beeinflusst das eine das andere nicht."),
    ("Wie berechnet man bei einem Baumdiagramm die Wahrscheinlichkeit eines Pfades?", "durch Multiplikation der Pfadwahrscheinlichkeiten",
     ["durch Addition", "durch Division", "durch Subtraktion"], "1. Pfadregel: entlang eines Pfades multiplizieren."),
    ("Was gibt der Erwartungswert einer Zufallsgröße an?", "den durchschnittlich zu erwartenden Wert",
     ["den größten Wert", "die Varianz", "die Häufigkeit null"], "E(X) ist der gewichtete Mittelwert."),
], "Grundregeln der Wahrscheinlichkeitsrechnung.",
   "Lambacher Schweizer, Stochastik.")

# ---------------- PHYSIK: Formeln & Konzepte ----------------
fact_block("Physik", "Formeln & Konzepte", "mittel", [
    ("Wie berechnet man die Geschwindigkeit bei gleichförmiger Bewegung?", "v = s / t",
     ["v = s·t", "v = t / s", "v = a·t²"], "Geschwindigkeit = Weg pro Zeit."),
    ("Wie ist die Beschleunigung definiert?", "a = Δv / Δt",
     ["a = v·t", "a = s / t", "a = F·m"], "Beschleunigung ist die zeitliche Änderung der Geschwindigkeit."),
    ("Wie berechnet man die Dichte eines Körpers?", "ρ = m / V",
     ["ρ = V / m", "ρ = m·V", "ρ = F / A"], "Dichte = Masse pro Volumen."),
    ("Wie berechnet man die mechanische Arbeit (konstante Kraft in Wegrichtung)?", "W = F · s",
     ["W = F / s", "W = m·g", "W = ½ m v²"], "Arbeit = Kraft mal Weg."),
    ("Wie viel beträgt die Lichtgeschwindigkeit im Vakuum näherungsweise?", "3·10⁸ m/s",
     ["3·10⁵ m/s", "343 m/s", "3·10¹² m/s"], "c ≈ 299.792.458 m/s."),
    ("Wie schnell ist der Schall in Luft ungefähr?", "etwa 343 m/s",
     ["etwa 3·10⁸ m/s", "etwa 10 m/s", "etwa 1500 m/s"], "Bei 20 °C breitet sich Schall mit ~343 m/s aus."),
    ("Was besagt das Reflexionsgesetz?", "Einfallswinkel = Ausfallswinkel",
     ["Licht wird immer gebrochen", "Licht verschwindet", "Winkel verdoppeln sich"],
     "Beide Winkel werden zum Lot gemessen."),
    ("Wie verhalten sich Widerstände in einer Reihenschaltung?", "sie addieren sich",
     ["sie halbieren sich", "nur der größte zählt", "sie heben sich auf"],
     "Reihenschaltung: R_ges = R₁ + R₂ + …"),
], "Zentrale Formeln und Gesetze der Physik.",
   "Gerthsen Physik; Formelsammlung.")

# ---------------- CHEMIE: Konzepte ----------------
fact_block("Chemie", "Konzepte", "mittel", [
    ("Was entsteht chemisch bei einer Verbrennung?", "Oxidation (Reaktion mit Sauerstoff)",
     ["Reduktion", "Destillation", "Neutralisation"], "Verbrennung ist eine schnelle Oxidation unter Energiefreisetzung."),
    ("Welche Teilchen bestimmen den sauren Charakter einer Lösung?", "H₃O⁺-Ionen",
     ["OH⁻-Ionen", "Na⁺-Ionen", "Elektronen"], "Je mehr H₃O⁺, desto saurer (kleiner pH)."),
    ("Welche Ionen überwiegen in einer basischen Lösung?", "OH⁻-Ionen",
     ["H₃O⁺-Ionen", "Cl⁻-Ionen", "Protonen"], "Basen liefern Hydroxid-Ionen."),
    ("In welcher Gruppe des Periodensystems stehen die Edelgase?", "8. Hauptgruppe (Gruppe 18)",
     ["1. Hauptgruppe", "7. Hauptgruppe", "2. Hauptgruppe"], "Edelgase haben eine volle Außenschale."),
    ("Zu welcher Gruppe gehören Natrium und Kalium?", "Alkalimetalle (1. Hauptgruppe)",
     ["Halogene", "Edelgase", "Erdalkalimetalle"], "Alkalimetalle sind sehr reaktiv."),
    ("Welches Trennverfahren nutzt unterschiedliche Siedetemperaturen?", "Destillation",
     ["Filtration", "Zentrifugieren", "Sieben"], "Bei der Destillation wird verdampft und wieder kondensiert."),
    ("Wie heißt ein elektrisch geladenes Atom oder Molekül?", "Ion",
     ["Isotop", "Molekül", "Radikal"], "Ionen entstehen durch Aufnahme oder Abgabe von Elektronen."),
    ("Was kennzeichnet eine exotherme Reaktion?", "Sie gibt Energie (Wärme) ab",
     ["Sie nimmt Energie auf", "Sie läuft nicht ab", "Sie benötigt kein Edukt"],
     "Bei exothermen Reaktionen ist die Energiebilanz negativ."),
], "Grundlegende chemische Konzepte.",
   "Bildungsplan Chemie.")

print("Mathe/Physik/Chemie-Konzepte geladen")

# ---------------- GEOGRAPHIE: Land -> Kontinent ----------------
_continents = ["Europa", "Asien", "Afrika", "Nordamerika", "Südamerika", "Ozeanien"]
_country_cont = [
    ("Deutschland", "Europa"), ("Frankreich", "Europa"), ("Spanien", "Europa"),
    ("Italien", "Europa"), ("Polen", "Europa"), ("Schweden", "Europa"),
    ("Griechenland", "Europa"), ("Portugal", "Europa"), ("Norwegen", "Europa"),
    ("China", "Asien"), ("Japan", "Asien"), ("Indien", "Asien"), ("Thailand", "Asien"),
    ("Vietnam", "Asien"), ("Südkorea", "Asien"), ("Iran", "Asien"),
    ("Saudi-Arabien", "Asien"), ("Indonesien", "Asien"), ("Pakistan", "Asien"),
    ("Ägypten", "Afrika"), ("Marokko", "Afrika"), ("Südafrika", "Afrika"),
    ("Nigeria", "Afrika"), ("Kenia", "Afrika"), ("Algerien", "Afrika"),
    ("Äthiopien", "Afrika"), ("Ghana", "Afrika"),
    ("USA", "Nordamerika"), ("Kanada", "Nordamerika"), ("Mexiko", "Nordamerika"),
    ("Brasilien", "Südamerika"), ("Argentinien", "Südamerika"), ("Chile", "Südamerika"),
    ("Peru", "Südamerika"), ("Kolumbien", "Südamerika"), ("Venezuela", "Südamerika"),
    ("Australien", "Ozeanien"), ("Neuseeland", "Ozeanien"),
]
for i, (land, kont) in enumerate(_country_cont):
    _mk("Geographie", "Kontinente", "leicht",
        f"Auf welchem Kontinent liegt {land}?",
        kont, [c for c in _continents if c != kont][:3],
        i,
        f"{land} liegt auf dem Kontinent {kont}.",
        "Die Erde wird meist in sechs bis sieben Kontinente eingeteilt.",
        "Diercke Weltatlas; Bildungsplan Geographie.",
        f"{land} – {kont}.",
        f"Nenne ein Nachbarland von {land}.")

# ---------------- INFORMATIK (Erweiterung) ----------------
fact_block("Informatik", "Grundbegriffe", "leicht", [
    ("Was ist ein Algorithmus?", "eine eindeutige, endliche Handlungsvorschrift zur Lösung eines Problems",
     ["ein Computervirus", "ein Betriebssystem", "ein Kabel"], "Ein Algorithmus besteht aus klar definierten Schritten."),
    ("Was macht ein Compiler?", "er übersetzt Quellcode in Maschinencode",
     ["er löscht Dateien", "er druckt Dokumente", "er verbindet Netzwerke"], "Der Compiler übersetzt vor der Ausführung."),
    ("Wofür steht RAM?", "Arbeitsspeicher (flüchtig)",
     ["Festplatte", "Prozessor", "Grafikkarte"], "RAM speichert Daten nur, solange Strom fließt."),
    ("Was ist HTML?", "eine Auszeichnungssprache für Webseiten",
     ["eine Programmiersprache für Spiele", "ein Virus", "ein Dateisystem"], "HTML strukturiert Inhalte im Web."),
    ("Was bezeichnet man als 'Bug'?", "einen Programmfehler",
     ["ein Eingabegerät", "ein Netzwerk", "eine Datei"], "Bugs führen zu fehlerhaftem Verhalten von Software."),
    ("Was ist Phishing?", "Betrug zum Abgreifen vertraulicher Daten",
     ["ein Spiel", "ein Dateiformat", "eine Suchmaschine"], "Phishing täuscht vertrauenswürdige Absender vor."),
    ("Welche Basis hat das Hexadezimalsystem?", "16",
     ["2", "8", "10"], "Hexadezimal nutzt die Ziffern 0–9 und A–F."),
    ("Was ist eine Variable in der Programmierung?", "ein benannter Speicherplatz für einen Wert",
     ["ein fester Text", "ein Bildformat", "ein Kabeltyp"], "Variablen können während der Laufzeit geändert werden."),
    ("Wofür sorgt eine Firewall?", "sie kontrolliert den Netzwerkverkehr und blockiert unerwünschte Zugriffe",
     ["sie kühlt den Prozessor", "sie speichert Daten", "sie erzeugt Strom"], "Eine Firewall schützt Systeme vor Angriffen."),
    ("Was bedeutet 'Open Source'?", "der Quellcode ist öffentlich einsehbar",
     ["die Software ist immer teuer", "es gibt keinen Code", "nur Firmen dürfen sie nutzen"],
     "Open-Source-Software darf meist eingesehen und verändert werden."),
], "Grundbegriffe der Informatik und IT-Sicherheit.",
   "Bildungsplan Informatik.")

# ---------------- GESCHICHTE: Person -> Rolle ----------------
fact_block("Geschichte", "Historische Persönlichkeiten", "mittel", [
    ("Wer war Julius Cäsar?", "ein römischer Feldherr und Diktator",
     ["ein ägyptischer Pharao", "ein griechischer Philosoph", "ein deutscher Kaiser"],
     "Cäsar prägte das späte römische Republik-Zeitalter; 44 v. Chr. ermordet."),
    ("Wer wurde 800 n. Chr. zum römisch-fränkischen Kaiser gekrönt?", "Karl der Große",
     ["Napoleon", "Otto von Bismarck", "Friedrich Barbarossa"],
     "Karl der Große gilt als 'Vater Europas'."),
    ("Wer war der erste Reichskanzler des Deutschen Kaiserreichs?", "Otto von Bismarck",
     ["Konrad Adenauer", "Wilhelm II.", "Willy Brandt"], "Bismarck prägte die Reichsgründung 1871."),
    ("Wer war der erste Bundeskanzler der Bundesrepublik Deutschland?", "Konrad Adenauer",
     ["Willy Brandt", "Helmut Kohl", "Otto von Bismarck"], "Adenauer regierte 1949–1963."),
    ("Wofür steht Napoleon Bonaparte?", "französischer Kaiser und Feldherr",
     ["römischer Senator", "englischer König", "russischer Zar"], "Napoleon dominierte Europa Anfang des 19. Jh."),
    ("Wofür ist Nelson Mandela bekannt?", "den Kampf gegen die Apartheid in Südafrika",
     ["die Mondlandung", "die Reformation", "die Entdeckung Amerikas"],
     "Mandela wurde 1994 erster schwarzer Präsident Südafrikas."),
    ("Wofür ist Mahatma Gandhi bekannt?", "gewaltlosen Widerstand für Indiens Unabhängigkeit",
     ["die Französische Revolution", "den Buchdruck", "die Relativitätstheorie"],
     "Gandhis Prinzip war der gewaltfreie Widerstand (Satyagraha)."),
    ("Wer entwickelte die Relativitätstheorie?", "Albert Einstein",
     ["Isaac Newton", "Galileo Galilei", "Nikolaus Kopernikus"], "Einstein veröffentlichte sie 1905/1915."),
], "Bedeutende Persönlichkeiten der Weltgeschichte.",
   "Bildungsplan Geschichte.")

print("Geographie-Kontinente / Informatik / Geschichte-Personen geladen")

# ---------------- LATEIN: Vokabeln Teil 2 ----------------
_la_vocab2 = [
    ("pater", "Vater"), ("mater", "Mutter"), ("filius", "Sohn"), ("filia", "Tochter"),
    ("frater", "Bruder"), ("soror", "Schwester"), ("canis", "Hund"), ("equus", "Pferd"),
    ("avis", "Vogel"), ("piscis", "Fisch"), ("flumen", "Fluss"), ("mons", "Berg"),
    ("mare", "Meer"), ("caelum", "Himmel"), ("ignis", "Feuer"), ("ventus", "Wind"),
    ("lux", "Licht"), ("verbum", "Wort"), ("nomen", "Name"), ("manus", "Hand"),
    ("caput", "Kopf"), ("oculus", "Auge"), ("cor", "Herz"), ("via", "Weg"),
    ("templum", "Tempel"),
]
_la_pool2 = [d for _, d in _la_vocab2]
for i, (la, de) in enumerate(_la_vocab2):
    _mk("Latein", "Vokabeln", "leicht",
        f"Was bedeutet das lateinische Wort '{la}'?",
        de, _others(de, _la_pool2[i+1:] + _la_pool2[:i]),
        i,
        f"'{la}' bedeutet auf Deutsch '{de}'.",
        "Grundwortschatz zu Familie, Natur und Körper.",
        "Bildungsplan Latein.",
        f"{la} – {de}.",
        f"Bestimme die Deklination von '{la}'.")

# ---------------- FRANZOESISCH: Vokabeln Teil 2 ----------------
_fr_vocab2 = [
    ("le père", "der Vater"), ("la mère", "die Mutter"), ("le frère", "der Bruder"),
    ("la sœur", "die Schwester"), ("le fils", "der Sohn"), ("la fleur", "die Blume"),
    ("l'arbre", "der Baum"), ("le feu", "das Feuer"), ("le vent", "der Wind"),
    ("la pluie", "der Regen"), ("la neige", "der Schnee"), ("froid", "kalt"),
    ("chaud", "warm"), ("blanc", "weiß"), ("noir", "schwarz"), ("jaune", "gelb"),
    ("dormir", "schlafen"), ("courir", "laufen"), ("voir", "sehen"), ("entendre", "hören"),
    ("donner", "geben"), ("prendre", "nehmen"), ("faire", "machen"), ("aller", "gehen"),
    ("venir", "kommen"), ("pouvoir", "können"), ("vouloir", "wollen"), ("savoir", "wissen"),
    ("la main", "die Hand"), ("la tête", "der Kopf"),
]
_fr_pool2 = [d for _, d in _fr_vocab2]
for i, (fr, de) in enumerate(_fr_vocab2):
    _mk("Französisch", "Vokabeln", "leicht",
        f"Was bedeutet das französische Wort '{fr}'?",
        de, _others(de, _fr_pool2[i+1:] + _fr_pool2[:i]),
        i,
        f"'{fr}' bedeutet auf Deutsch '{de}'.",
        "Erweiterter Grundwortschatz zu Familie und Natur.",
        "Bildungsplan Französisch.",
        f"{fr} – {de}.",
        f"Konjugiere bzw. dekliniere '{fr}' passend.")

# ---------------- ENGLISCH: Gegenteile ----------------
_opposites = [
    ("light", "dark"), ("high", "low"), ("long", "short"), ("new", "old"),
    ("rich", "poor"), ("strong", "weak"), ("full", "empty"), ("open", "closed"),
    ("easy", "difficult"), ("early", "late"), ("wet", "dry"), ("clean", "dirty"),
    ("near", "far"), ("true", "false"), ("day", "night"), ("win", "lose"),
    ("remember", "forget"), ("hot", "cold"), ("fast", "slow"), ("happy", "sad"),
]
_opp_pool = [b for _, b in _opposites]
for i, (word, opp) in enumerate(_opposites):
    _mk("Englisch", "Gegenteile", "leicht",
        f"What is the opposite of '{word}'?",
        opp, _others(opp, _opp_pool[i+1:] + _opp_pool[:i]),
        i,
        f"The opposite of '{word}' is '{opp}'.",
        "Antonym pairs expand active vocabulary.",
        "Bildungsplan Englisch.",
        f"{word} ↔ {opp}.",
        f"Use '{opp}' in an English sentence.")

print("Latein/Französisch Vokabeln 2 + Englisch Gegenteile geladen")

# ---------------- GEOGRAPHIE: deutsche Bundesländer -> Hauptstadt ----------------
_bl = [
    ("Baden-Württemberg", "Stuttgart"), ("Bayern", "München"), ("Brandenburg", "Potsdam"),
    ("Hessen", "Wiesbaden"), ("Mecklenburg-Vorpommern", "Schwerin"), ("Niedersachsen", "Hannover"),
    ("Nordrhein-Westfalen", "Düsseldorf"), ("Rheinland-Pfalz", "Mainz"), ("Saarland", "Saarbrücken"),
    ("Sachsen", "Dresden"), ("Sachsen-Anhalt", "Magdeburg"), ("Schleswig-Holstein", "Kiel"),
    ("Thüringen", "Erfurt"),
]
_bl_pool = [c for _, c in _bl]
for i, (land, cap) in enumerate(_bl):
    _mk("Geographie", "Deutsche Bundesländer", "mittel",
        f"Wie heißt die Landeshauptstadt von {land}?",
        cap, _others(cap, _bl_pool[i+1:] + _bl_pool[:i]),
        i,
        f"Die Landeshauptstadt von {land} ist {cap}.",
        "Deutschland hat 16 Bundesländer, darunter drei Stadtstaaten.",
        "Diercke Weltatlas; Bildungsplan Geographie.",
        f"{land} – {cap}.",
        f"Nenne eine Besonderheit des Bundeslandes {land}.")

# ---------------- DEUTSCH: Literaturepochen ----------------
fact_block("Deutsch", "Literaturepochen", "schwer", [
    ("Welche Epoche stellt Vernunft und Kritik in den Mittelpunkt (18. Jh.)?", "Aufklärung",
     ["Romantik", "Barock", "Expressionismus"], "Leitspruch: 'Habe Mut, dich deines eigenen Verstandes zu bedienen' (Kant)."),
    ("Welche Strömung betont jugendliches Gefühl und Geniekult (um 1770)?", "Sturm und Drang",
     ["Klassik", "Realismus", "Naturalismus"], "Goethes 'Werther' ist ein Hauptwerk des Sturm und Drang."),
    ("Welche Epoche strebt Harmonie, Humanität und Maß an (Goethe, Schiller)?", "Weimarer Klassik",
     ["Barock", "Romantik", "Moderne"], "Vorbild war die Antike (Kalokagathie)."),
    ("Welche Epoche ist durch Vanitas-Gedanken und 'carpe diem' geprägt?", "Barock",
     ["Aufklärung", "Realismus", "Expressionismus"], "Der Dreißigjährige Krieg prägte das Vergänglichkeitsbewusstsein."),
    ("Welche Epoche will die Wirklichkeit möglichst objektiv darstellen (Fontane)?", "Realismus",
     ["Romantik", "Sturm und Drang", "Barock"], "Der poetische Realismus verschönert die Wirklichkeit maßvoll."),
    ("Welche Strömung des frühen 20. Jh. betont subjektives, oft verzerrtes Erleben?", "Expressionismus",
     ["Klassik", "Aufklärung", "Biedermeier"], "Der Expressionismus arbeitet mit starken Bildern und Gefühlen."),
], "Abfolge und Merkmale der deutschen Literaturepochen.",
   "Bildungsplan Deutsch Oberstufe.")

# ---------------- BIOLOGIE (Erweiterung 2) ----------------
fact_block("Biologie", "Grundwissen", "mittel", [
    ("Wie viele Chromosomen hat eine normale menschliche Körperzelle?", "46",
     ["23", "48", "44"], "Der Mensch hat 23 Chromosomenpaare (46 insgesamt)."),
    ("Welche fünf Wirbeltierklassen unterscheidet man?", "Fische, Amphibien, Reptilien, Vögel, Säugetiere",
     ["nur Fische und Säugetiere", "Insekten, Spinnen, Krebse", "Pflanzen, Pilze, Bakterien"],
     "Wirbeltiere besitzen eine Wirbelsäule."),
    ("Wie viele Kammern hat das menschliche Herz?", "vier (zwei Vorhöfe, zwei Kammern)",
     ["zwei", "drei", "fünf"], "Das Herz pumpt Blut durch Lungen- und Körperkreislauf."),
    ("Wo findet im menschlichen Körper der Gasaustausch statt?", "in den Lungenbläschen (Alveolen)",
     ["im Magen", "in der Leber", "im Gehirn"], "In den Alveolen gelangt O₂ ins Blut, CO₂ heraus."),
    ("Was sind die Edukte der Fotosynthese?", "Kohlenstoffdioxid und Wasser",
     ["Glucose und Sauerstoff", "Stickstoff und Methan", "Salz und Zucker"],
     "Aus CO₂ und H₂O entstehen mit Lichtenergie Glucose und O₂."),
    ("Wodurch entsteht genetische Variabilität vor allem?", "durch Mutation und Rekombination",
     ["nur durch Ernährung", "durch Training", "gar nicht"], "Variabilität ist Grundlage der Evolution."),
    ("Wie nennt man die Beziehung zwischen Jäger und Gejagtem?", "Räuber-Beute-Beziehung",
     ["Symbiose", "Parasitismus", "Konkurrenz"], "Räuber- und Beutepopulation beeinflussen sich wechselseitig."),
    ("Sind Keimzellen (Ei/Spermium) haploid oder diploid?", "haploid",
     ["diploid", "triploid", "ohne Chromosomen"], "Keimzellen tragen den einfachen Chromosomensatz."),
], "Vertiefendes Grundwissen der Biologie.",
   "Bildungsplan Biologie.")

# ---------------- SPORT (Erweiterung) ----------------
fact_block("Sport", "Sportarten & Training", "leicht", [
    ("Wie viele Spieler stehen beim Handball pro Team auf dem Feld?", "sieben",
     ["sechs", "fünf", "elf"], "Sechs Feldspieler und ein Torwart."),
    ("Wie viele Spieler stehen beim Basketball pro Team auf dem Feld?", "fünf",
     ["sieben", "sechs", "vier"], "Beim Basketball spielen fünf gegen fünf."),
    ("Welche Energiebereitstellung überwiegt beim 100-Meter-Sprint?", "anaerob",
     ["aerob allein", "nur durch Fett", "gar keine"], "Kurze Maximalbelastung erfolgt überwiegend anaerob."),
    ("Warum ist Aufwärmen vor dem Sport sinnvoll?", "es beugt Verletzungen vor und bereitet den Körper vor",
     ["es macht müde", "es baut Muskeln ab", "es hat keinen Nutzen"], "Aufwärmen erhöht Durchblutung und Beweglichkeit."),
    ("Was bezeichnet 'Koordination' im Sport?", "das Zusammenspiel von Nerven und Muskeln",
     ["reine Kraft", "nur Ausdauer", "Gewicht"], "Koordination umfasst Gleichgewicht, Rhythmus und Reaktion."),
], "Regeln und Trainingsgrundlagen verschiedener Sportarten.",
   "Bildungsplan Sport.")

print("Bundesländer/Deutsch-Epochen/Biologie2/Sport2 geladen")

fact_block("Religion", "Religionskunde", "mittel", [
    ("Was bezeichnet die christliche Dreieinigkeit (Trinität)?", "Vater, Sohn und Heiliger Geist",
     ["drei Götter", "drei Propheten", "drei Bücher"], "Ein Gott in drei 'Personen'."),
    ("Welches christliche Fest feiert die Sendung des Heiligen Geistes?", "Pfingsten",
     ["Ostern", "Weihnachten", "Erntedank"], "Pfingsten gilt als 'Geburtstag der Kirche'."),
    ("Welche Stadt ist für Judentum, Christentum und Islam heilig?", "Jerusalem",
     ["Mekka", "Rom", "Athen"], "In Jerusalem liegen Klagemauer, Grabeskirche und Felsendom."),
    ("Wie heißt der Fastenmonat im Islam?", "Ramadan",
     ["Hadsch", "Pessach", "Advent"], "Im Ramadan wird tagsüber gefastet."),
    ("Welches Ziel strebt der Buddhismus an?", "das Nirwana (Erlöschen des Leidens)",
     ["Reichtum", "den Himmel", "die Weltherrschaft"], "Durch den achtfachen Pfad soll das Leiden überwunden werden."),
    ("Wie heißt das jüdische Gotteshaus?", "Synagoge",
     ["Moschee", "Kirche", "Tempel"], "In der Synagoge wird die Tora gelesen."),
    ("Wie heißt das islamische Gotteshaus?", "Moschee",
     ["Synagoge", "Kirche", "Pagode"], "Die Moschee ist Ort des gemeinsamen Gebets."),
    ("Welches Gebot gilt als zentral im Christentum?", "die Nächstenliebe",
     ["Rache", "Reichtum", "Schweigen"], "'Liebe deinen Nächsten wie dich selbst.'"),
    ("Welche Vorstellung ist typisch für Hinduismus und Buddhismus?", "Reinkarnation (Wiedergeburt)",
     ["ein einmaliges Leben", "kein Jenseits", "nur ein Gott"], "Die Seele durchläuft einen Kreislauf von Wiedergeburten."),
], "Begriffe und Feste der Weltreligionen.", "Bildungsplan Religion.")

fact_block("Ethik/Philosophie", "Ethik", "mittel", [
    ("Was besagt die 'Goldene Regel'?", "Behandle andere so, wie du selbst behandelt werden möchtest",
     ["Der Stärkere hat recht", "Jeder für sich", "Geld regiert die Welt"], "Sie findet sich in vielen Kulturen und Religionen."),
    ("Was versteht man unter einem Wert?", "eine erstrebenswerte Grundvorstellung (z. B. Gerechtigkeit)",
     ["ein Geldbetrag", "ein Gesetz", "eine Zahl"], "Werte prägen das Handeln und begründen Normen."),
    ("Was ist eine Norm?", "eine konkrete Handlungsregel, die aus Werten folgt",
     ["ein Gefühl", "eine Meinung", "ein Zufall"], "Normen regeln das Zusammenleben (z. B. 'Du sollst nicht lügen')."),
    ("Was bezeichnet das 'Gewissen'?", "die innere Instanz, die Handeln moralisch beurteilt",
     ["das Gedächtnis", "ein Organ", "die Logik"], "Das Gewissen meldet sich bei moralischen Entscheidungen."),
    ("Was ist ein moralisches Dilemma?", "eine Situation, in der jede Entscheidung Nachteile hat",
     ["ein einfaches Problem", "eine Rechenaufgabe", "ein Spiel"], "Bei Dilemmata stehen Pflichten im Konflikt."),
    ("Worauf gründen sich die Menschenrechte?", "auf die Würde und Gleichheit aller Menschen",
     ["auf Besitz", "auf Herkunft", "auf Stärke"], "Sie gelten universell und unveräußerlich."),
], "Grundbegriffe der Ethik.", "Bildungsplan Ethik.")

fact_block("Musik", "Musiktheorie", "mittel", [
    ("Wie viele Töne bilden einen Dreiklang?", "drei",
     ["zwei", "vier", "fünf"], "Ein Dur-/Moll-Dreiklang besteht aus Grundton, Terz und Quinte."),
    ("Welche Tonart hat keine Vorzeichen?", "C-Dur",
     ["G-Dur", "F-Dur", "D-Dur"], "C-Dur nutzt nur die weißen Tasten."),
    ("Welcher Notenschlüssel steht für hohe Töne?", "Violinschlüssel (G-Schlüssel)",
     ["Bassschlüssel", "Tenorschlüssel", "Altschlüssel"], "Der Bassschlüssel notiert tiefe Töne."),
    ("In welcher Epoche wirkte Johann Sebastian Bach?", "Barock",
     ["Klassik", "Romantik", "Moderne"], "Bach gilt als Vollender der Barockmusik."),
    ("In welcher Epoche wirkte Wolfgang Amadeus Mozart?", "Wiener Klassik",
     ["Barock", "Romantik", "Renaissance"], "Mozart, Haydn und Beethoven prägten die Wiener Klassik."),
    ("Was bezeichnet die 'Melodie'?", "eine sinnvolle Folge von Tönen",
     ["das Zusammenklingen von Tönen", "die Lautstärke", "das Tempo"], "Harmonie ist das Zusammenklingen, Melodie die Tonfolge."),
    ("Was bezeichnet ein 'Intervall'?", "den Abstand zwischen zwei Tönen",
     ["die Lautstärke", "das Instrument", "die Pause"], "Beispiele: Terz, Quinte, Oktave."),
], "Grundlagen der Musiktheorie.", "Bildungsplan Musik.")

fact_block("Kunst", "Stilrichtungen & Technik", "mittel", [
    ("Welche drei Farben sind die Sekundärfarben (aus Primärfarben gemischt)?", "Orange, Grün, Violett",
     ["Rot, Gelb, Blau", "Schwarz, Weiß, Grau", "Braun, Beige, Ocker"], "Je zwei Primärfarben ergeben eine Sekundärfarbe."),
    ("Welches Baustilmerkmal ist typisch für die Gotik?", "der Spitzbogen",
     ["der Rundbogen", "die Flachdecke", "die Kuppel allein"], "Gotische Kathedralen streben mit Spitzbögen in die Höhe."),
    ("Welcher Rundbogen ist typisch für die Romanik?", "der Rundbogen",
     ["der Spitzbogen", "der Kielbogen", "kein Bogen"], "Die Romanik wirkt massiv und wuchtig."),
    ("Wer gilt als Hauptvertreter der Pop Art?", "Andy Warhol",
     ["Claude Monet", "Albrecht Dürer", "Michelangelo"], "Warhol nutzte Motive der Konsumwelt (z. B. Suppendosen)."),
    ("Wer malte 'Die Sternennacht'?", "Vincent van Gogh",
     ["Pablo Picasso", "Leonardo da Vinci", "Rembrandt"], "Van Gogh ist ein Wegbereiter des Expressionismus."),
    ("Was bezeichnet eine 'Plastik' bzw. Skulptur?", "ein dreidimensionales Kunstwerk",
     ["ein Gemälde", "eine Zeichnung", "ein Foto"], "Skulpturen sind räumlich und von allen Seiten betrachtbar."),
    ("Welche Schule prägte das moderne Design im 20. Jahrhundert maßgeblich?", "das Bauhaus",
     ["die Gotik", "der Barock", "die Romanik"], "Das Bauhaus (ab 1919) verband Kunst, Handwerk und Funktion."),
], "Stilrichtungen und Grundbegriffe der Kunst.", "Bildungsplan Bildende Kunst.")

fact_block("Politik", "Demokratie & Institutionen", "mittel", [
    ("Was bedeutet der Begriff 'Demokratie' wörtlich?", "Herrschaft des Volkes",
     ["Herrschaft eines Einzelnen", "Herrschaft der Reichen", "Herrschaft der Kirche"], "Von griech. demos (Volk) und kratos (Herrschaft)."),
    ("Wie lang dauert eine Legislaturperiode des Bundestags regulär?", "vier Jahre",
     ["zwei Jahre", "fünf Jahre", "sechs Jahre"], "Danach finden Neuwahlen statt."),
    ("Was ist eine Koalition?", "ein Regierungsbündnis mehrerer Parteien",
     ["eine einzelne Partei", "ein Gericht", "eine Behörde"], "Koalitionen entstehen, wenn keine Partei allein die Mehrheit hat."),
    ("Welche Aufgabe hat die parlamentarische Opposition?", "die Regierung zu kontrollieren und Alternativen zu bieten",
     ["Gesetze zu unterschreiben", "Richter zu ernennen", "Steuern einzutreiben"], "Die Opposition ist Teil einer funktionierenden Demokratie."),
    ("Welches Grundrecht schützt Artikel 5 GG unter anderem?", "die Meinungs- und Pressefreiheit",
     ["das Eigentum allein", "die Freizügigkeit", "die Religionsfreiheit allein"], "Freie Meinung ist Grundlage der Demokratie."),
    ("Wo hat die UNO ihren Hauptsitz?", "New York",
     ["Genf", "Brüssel", "Wien"], "Die Vereinten Nationen tagen in New York."),
    ("Wie viele Mitgliedsstaaten hat die EU (Stand nach dem Brexit)?", "27",
     ["25", "28", "30"], "Mit dem Austritt Großbritanniens sank die Zahl auf 27."),
    ("Was ist die NATO?", "ein Verteidigungsbündnis",
     ["eine Währung", "ein Gericht", "ein Parlament"], "Die NATO ist ein militärisches Bündnis westlicher Staaten."),
], "Institutionen und Prinzipien der Demokratie.", "Bildungsplan Gemeinschaftskunde.")

fact_block("Wirtschaft", "Markt & Geld", "mittel", [
    ("Was passiert laut Marktgesetz typischerweise, wenn das Angebot stark steigt und die Nachfrage gleich bleibt?", "der Preis sinkt tendenziell",
     ["der Preis steigt", "der Preis bleibt immer gleich", "der Markt verschwindet"], "Überangebot drückt in der Regel den Preis."),
    ("Was ist ein Monopol?", "ein Markt mit nur einem Anbieter",
     ["ein Markt mit vielen Anbietern", "ein Markt ohne Nachfrage", "ein Staatshaushalt"], "Ein Monopolist kann Preise stark beeinflussen."),
    ("Was beschreibt der Begriff 'Konjunktur'?", "den Auf- und Abschwung der Wirtschaft",
     ["den Staatshaushalt", "die Bevölkerungszahl", "das Wetter"], "Die Konjunktur verläuft in Zyklen."),
    ("Wofür erhebt der Staat Steuern?", "zur Finanzierung öffentlicher Aufgaben",
     ["zur Gewinnmaximierung von Firmen", "zum Spaß", "aus Zufall"], "Steuern finanzieren Bildung, Straßen, Sicherheit u. a."),
    ("Was unterscheidet die Planwirtschaft von der Marktwirtschaft?", "der Staat plant Produktion und Preise zentral",
     ["Preise entstehen nur am Markt", "es gibt kein Geld", "nur Firmen entscheiden"], "In der Planwirtschaft lenkt der Staat die Wirtschaft."),
    ("Was versteht man unter Globalisierung?", "die weltweite Verflechtung von Wirtschaft und Gesellschaft",
     ["Abschottung der Märkte", "nur nationalen Handel", "das Ende des Handels"], "Güter, Kapital und Informationen fließen weltweit."),
], "Grundlagen von Markt und Geldwirtschaft.", "Bildungsplan Wirtschaft.")

print("Humaniora-Erweiterung geladen")

fact_block("Mathematik", "Begriffe & Trigonometrie", "mittel", [
    ("Was ist eine Primzahl?", "eine natürliche Zahl > 1, die nur durch 1 und sich selbst teilbar ist",
     ["jede gerade Zahl", "jede Zahl mit Komma", "jede negative Zahl"], "Beispiele: 2, 3, 5, 7, 11 …"),
    ("Welches ist die kleinste Primzahl?", "2",
     ["1", "0", "3"], "2 ist zugleich die einzige gerade Primzahl."),
    ("Wie ist der Sinus im rechtwinkligen Dreieck definiert?", "Gegenkathete / Hypotenuse",
     ["Ankathete / Hypotenuse", "Gegenkathete / Ankathete", "Hypotenuse / Gegenkathete"], "SOH: Sinus = Opposite/Hypotenuse."),
    ("Wie ist der Kosinus definiert?", "Ankathete / Hypotenuse",
     ["Gegenkathete / Hypotenuse", "Gegenkathete / Ankathete", "Hypotenuse / Ankathete"], "CAH: Cosinus = Adjacent/Hypotenuse."),
    ("Wie ist der Tangens definiert?", "Gegenkathete / Ankathete",
     ["Ankathete / Gegenkathete", "Gegenkathete / Hypotenuse", "Hypotenuse / Ankathete"], "TOA: Tangens = Opposite/Adjacent."),
    ("Wie lautet die allgemeine Form einer linearen Funktion?", "y = mx + b",
     ["y = ax² + bx + c", "y = a/x", "y = a^x"], "m ist die Steigung, b der y-Achsenabschnitt."),
    ("Wie groß ist ein rechter Winkel?", "90°",
     ["45°", "180°", "360°"], "Zwei zueinander senkrechte Geraden bilden 90°."),
    ("Wie berechnet man das arithmetische Mittel mehrerer Zahlen?", "Summe der Werte geteilt durch ihre Anzahl",
     ["den größten Wert", "den mittleren Wert nach Sortierung", "das Produkt"], "Der nach Sortierung mittlere Wert wäre der Median."),
    ("Was gibt die Kreiszahl π an?", "das Verhältnis von Umfang zu Durchmesser eines Kreises",
     ["die Fläche eines Quadrats", "die Anzahl der Ecken", "den Radius"], "π ≈ 3,14159 … ist irrational."),
], "Begriffe, Funktionen und Trigonometrie.", "Formelsammlung Mathematik.")

fact_block("Physik", "Alltag & Grundlagen", "mittel", [
    ("Was besagt das Trägheitsprinzip (1. Newton)?", "Ein Körper bleibt in Ruhe oder gleichförmiger Bewegung, solange keine Kraft wirkt",
     ["Kraft = Masse mal Beschleunigung", "actio = reactio", "Energie geht verloren"], "Deshalb braucht man Sicherheitsgurte."),
    ("Wie verhalten sich gleichnamige Magnetpole zueinander?", "sie stoßen sich ab",
     ["sie ziehen sich an", "sie berühren sich nie", "nichts passiert"], "Ungleichnamige Pole ziehen sich an."),
    ("Was benötigt ein elektrischer Strom, um zu fließen?", "einen geschlossenen Stromkreis",
     ["einen offenen Schalter", "kein Material", "immer Wechselstrom"], "Ist der Kreis unterbrochen, fließt kein Strom."),
    ("Was ist ein elektrischer Isolator?", "ein Stoff, der den Strom kaum leitet",
     ["ein guter Leiter", "eine Batterie", "ein Magnet"], "Beispiele: Gummi, Glas, Kunststoff."),
    ("Welche drei Arten der Wärmeübertragung gibt es?", "Leitung, Strömung, Strahlung",
     ["nur Leitung", "Reflexion, Brechung, Beugung", "feste, flüssige, gasförmige"], "Wärme kann auf drei Wegen übertragen werden."),
    ("Was besagt das archimedische Prinzip?", "Der Auftrieb entspricht dem Gewicht des verdrängten Wassers",
     ["Kraft = Masse × Weg", "Licht breitet sich geradlinig aus", "Energie ist Masse"], "Deshalb schwimmen Schiffe."),
    ("Was misst die Frequenz?", "die Anzahl der Schwingungen pro Sekunde",
     ["die Lautstärke", "die Temperatur", "die Masse"], "Einheit: Hertz (1 Hz = 1 Schwingung/s)."),
    ("Was sammelt eine Sammellinse (konvex)?", "parallel einfallendes Licht in einem Brennpunkt",
     ["sie zerstreut Licht", "sie verschluckt Licht", "sie erzeugt Strom"], "Sammellinsen werden z. B. in Lupen genutzt."),
], "Physik im Alltag.", "Gerthsen Physik.")

fact_block("Chemie", "Stoffe & Formeln", "mittel", [
    ("Welche Summenformel hat Wasser?", "H₂O",
     ["CO₂", "O₂", "H₂O₂"], "Zwei Wasserstoff- und ein Sauerstoffatom."),
    ("Welche Summenformel hat Kohlenstoffdioxid?", "CO₂",
     ["CO", "C₂O", "CaO"], "Ein Kohlenstoff- und zwei Sauerstoffatome."),
    ("Welche Formel hat Salzsäure (gelöst)?", "HCl",
     ["H₂SO₄", "HNO₃", "NaCl"], "HCl ist eine starke Säure."),
    ("Welche Formel hat Ammoniak?", "NH₃",
     ["NO₂", "NH₄", "N₂O"], "Ammoniak riecht stechend und ist Grundstoff für Dünger."),
    ("Woraus bestehen Proteine als Grundbausteine?", "aus Aminosäuren",
     ["aus Zuckern", "aus Fetten", "aus Mineralien"], "Proteine sind Ketten aus Aminosäuren."),
    ("Was entsteht, wenn Eisen mit Sauerstoff und Wasser reagiert?", "Rost (Eisenoxid)",
     ["Gold", "Salz", "Kohle"], "Rost ist eine langsame Oxidation des Eisens."),
    ("Welche Formel hat Trinkalkohol (Ethanol)?", "C₂H₅OH",
     ["CH₄", "CH₃OH", "C₆H₁₂O₆"], "Ethanol ist der Alkohol in Getränken."),
    ("Was ist eine Legierung?", "ein Gemisch aus mindestens einem Metall mit anderen Stoffen",
     ["ein reines Element", "eine Säure", "ein Gas"], "Beispiel: Messing (Kupfer und Zink)."),
], "Stoffe, Formeln und Reaktionen.", "Bildungsplan Chemie.")

fact_block("Informatik", "Digitale Welt", "leicht", [
    ("Was ist ein Pixel?", "der kleinste Bildpunkt einer digitalen Grafik",
     ["ein Programmfehler", "ein Prozessor", "ein Kabel"], "Je mehr Pixel, desto höher die Auflösung."),
    ("Wie viele Zustände kennt ein einzelnes Bit?", "zwei (0 und 1)",
     ["acht", "zehn", "unendlich"], "Computer rechnen binär mit 0 und 1."),
    ("Was ist ein Backup?", "eine Sicherungskopie von Daten",
     ["ein Virus", "ein Browser", "ein Drucker"], "Backups schützen vor Datenverlust."),
    ("Was versteht man unter Spam?", "unerwünschte Massen-E-Mails",
     ["ein Betriebssystem", "ein Spiel", "ein Kabel"], "Spamfilter sortieren solche Nachrichten aus."),
    ("Was ist ein Browser?", "ein Programm zum Anzeigen von Webseiten",
     ["eine Festplatte", "ein Virus", "ein Netzwerkkabel"], "Beispiele: Firefox, Chrome, Edge."),
    ("Was beschreibt das Client-Server-Modell?", "ein Client fragt Daten an, ein Server stellt sie bereit",
     ["zwei gleichberechtigte Drucker", "ein einzelner Computer", "ein Kabeltyp"], "Webseiten werden von Servern ausgeliefert."),
    ("Welche Dateiendung steht typischerweise für ein Bild?", ".jpg",
     [".exe", ".docx", ".mp3"], ".jpg/.png sind Bildformate, .mp3 ist Audio."),
    ("Wofür steht die Abkürzung KI?", "Künstliche Intelligenz",
     ["Kabel-Interface", "Konstante Information", "Kern-Instanz"], "KI-Systeme lernen aus Daten."),
], "Begriffe der digitalen Welt.", "Bildungsplan Informatik.")

fact_block("Geographie", "Physische Geographie", "mittel", [
    ("Welches ist der höchste Berg Deutschlands?", "Zugspitze",
     ["Brocken", "Feldberg", "Watzmann"], "Die Zugspitze ist 2.962 m hoch."),
    ("Welches ist die größte Insel der Erde?", "Grönland",
     ["Australien", "Madagaskar", "Island"], "Australien gilt als Kontinent, nicht als Insel."),
    ("Welche ist die größte heiße Wüste der Erde?", "Sahara",
     ["Gobi", "Kalahari", "Atacama"], "Die Sahara liegt in Nordafrika."),
    ("Wie viele Kontinente werden üblicherweise unterschieden?", "sieben",
     ["fünf", "drei", "zehn"], "Je nach Zählweise sechs oder sieben Kontinente."),
    ("Was bezeichnet die Plattentektonik?", "die Bewegung der Erdkrustenplatten",
     ["das Wetter", "die Meeresströmung", "die Jahreszeiten"], "Sie verursacht Erdbeben und Gebirgsbildung."),
    ("Welche Energiequellen gelten als erneuerbar?", "Sonne, Wind und Wasser",
     ["Kohle, Öl und Gas", "Uran", "Torf"], "Erneuerbare Energien erschöpfen sich praktisch nicht."),
    ("Was teilt der Äquator?", "die Erde in Nord- und Südhalbkugel",
     ["Ost und West", "Land und Meer", "Tag und Nacht"], "Der Äquator liegt bei 0° Breite."),
    ("Was ist ein Ballungsraum?", "ein dicht besiedeltes Gebiet mit mehreren verbundenen Städten",
     ["eine einzelne Insel", "ein unbewohntes Gebiet", "ein Gebirge"], "Beispiel: das Ruhrgebiet."),
], "Physische und humangeographische Grundlagen.", "Diercke Weltatlas.")

print("STEM + Geographie Final-Erweiterung geladen")

# ---------------- ENGLISCH: Essen & Berufe ----------------
_en_vocab3 = [
    ("Apfel", "apple"), ("Brot", "bread"), ("Käse", "cheese"), ("Milch", "milk"),
    ("Ei", "egg"), ("Fleisch", "meat"), ("Gemüse", "vegetables"), ("Obst", "fruit"),
    ("Kartoffel", "potato"), ("Reis", "rice"), ("Zucker", "sugar"), ("Salz", "salt"),
    ("Kaffee", "coffee"), ("Tee", "tea"), ("Lehrer", "teacher"), ("Arzt", "doctor"),
    ("Anwalt", "lawyer"), ("Ingenieur", "engineer"), ("Krankenschwester", "nurse"),
    ("Koch", "cook"), ("Bäcker", "baker"), ("Polizist", "police officer"),
    ("Bauer", "farmer"), ("Verkäufer", "salesperson"), ("Schüler", "pupil"),
]
_en3_pool = [e for _, e in _en_vocab3]
for i, (de, en) in enumerate(_en_vocab3):
    _mk("Englisch", "Vokabeln (Essen & Berufe)", "leicht",
        f"Wie heißt '{de}' auf Englisch?",
        en, _others(en, _en3_pool[i+1:] + _en3_pool[:i]),
        i, f"'{de}' heißt auf Englisch '{en}'.",
        "Wortfelder wie Essen und Berufe gehören zum Alltagswortschatz.",
        "Bildungsplan Englisch.", f"{de} – {en}.",
        f"Bilde einen Satz mit '{en}'.")

# ---------------- FRANZOESISCH: Tage & Zahlen ----------------
_fr_vocab3 = [
    ("lundi", "Montag"), ("mardi", "Dienstag"), ("mercredi", "Mittwoch"),
    ("jeudi", "Donnerstag"), ("vendredi", "Freitag"), ("samedi", "Samstag"),
    ("dimanche", "Sonntag"), ("un", "eins"), ("deux", "zwei"), ("trois", "drei"),
    ("cinq", "fünf"), ("dix", "zehn"), ("vingt", "zwanzig"), ("cent", "hundert"),
    ("mille", "tausend"),
]
_fr3_pool = [d for _, d in _fr_vocab3]
for i, (fr, de) in enumerate(_fr_vocab3):
    _mk("Französisch", "Tage & Zahlen", "leicht",
        f"Was bedeutet '{fr}' auf Deutsch?",
        de, _others(de, _fr3_pool[i+1:] + _fr3_pool[:i]),
        i, f"'{fr}' bedeutet '{de}'.",
        "Wochentage und Zahlen gehören zum Basiswortschatz.",
        "Bildungsplan Französisch.", f"{fr} – {de}.",
        f"Verwende '{fr}' in einem kurzen Satz.")

fact_block("Englisch", "Grammar basics", "mittel", [
    ("What is the comparative of 'good'?", "better", ["gooder", "best", "more good"], "'good – better – best' is irregular."),
    ("What is the superlative of 'good'?", "best", ["goodest", "better", "most good"], "Irregular comparison form."),
    ("What is the plural of 'child'?", "children", ["childs", "childes", "childrens"], "'child' has an irregular plural."),
    ("What is the plural of 'mouse' (animal)?", "mice", ["mouses", "mouse", "mies"], "Irregular plural form."),
    ("Which word fits? 'How ___ water is there?'", "much", ["many", "few", "number"], "'much' is used with uncountable nouns."),
    ("Which word fits? 'How ___ apples are there?'", "many", ["much", "few", "amount"], "'many' is used with countable nouns."),
    ("Which tense is 'She is reading'?", "present progressive/continuous", ["simple past", "present perfect", "future"], "Form: am/is/are + -ing."),
    ("Which question word asks about a place?", "where", ["when", "why", "who"], "'where' asks for a location."),
    ("Which question word asks about time?", "when", ["where", "which", "how"], "'when' asks for a point in time."),
    ("Third person singular of 'to play' in simple present?", "plays", ["play", "playes", "playing"], "Add -s in the third person singular."),
], "Core grammar points of English.", "Bildungsplan Englisch.")

fact_block("Deutsch", "Grammatik & Textformen", "mittel", [
    ("Welcher Satzteil beantwortet die Frage 'Wer oder was?'", "das Subjekt",
     ["das Objekt", "das Prädikat", "das Attribut"], "Das Subjekt ist der Satzgegenstand."),
    ("Welcher Satzteil ist die Satzaussage (meist das Verb)?", "das Prädikat",
     ["das Subjekt", "das Attribut", "das Adverb"], "Das Prädikat bildet den Kern der Aussage."),
    ("Was ist ein Synonym?", "ein Wort mit gleicher oder ähnlicher Bedeutung",
     ["ein Gegenteil", "ein Fremdwort", "ein Satzzeichen"], "Beispiel: schnell – rasch."),
    ("Was kennzeichnet eine Fabel?", "Tiere handeln wie Menschen und vermitteln eine Lehre",
     ["ein langes Versepos", "ein wissenschaftlicher Text", "ein Zeitungsbericht"], "Am Ende steht oft eine Moral."),
    ("Wie viele Verse hat ein klassisches Sonett?", "vierzehn",
     ["acht", "zehn", "zwölf"], "Ein Sonett besteht aus zwei Quartetten und zwei Terzetten."),
    ("Was ist eine Ballade?", "ein erzählendes Gedicht mit dramatischem Geschehen",
     ["ein kurzer Sachtext", "ein Tagebucheintrag", "ein Werbeslogan"], "Balladen verbinden Lyrik, Epik und Dramatik."),
    ("Wann steht vor einem Nebensatz ein Komma?", "immer, der Nebensatz wird mit Komma abgetrennt",
     ["nie", "nur bei Fragen", "nur am Textende"], "Gliedsätze werden durch Komma abgetrennt."),
], "Satzglieder und literarische Formen.", "Bildungsplan Deutsch.")

print("Vokabel/Grammatik Final geladen")

fact_block("Geschichte", "Epochen", "mittel", [
    ("Welche Epoche folgt in Europa auf die Antike (ca. 500–1500)?", "das Mittelalter",
     ["die Neuzeit", "die Renaissance", "die Aufklärung"], "Das Mittelalter liegt zwischen Antike und Neuzeit."),
    ("Was bedeutet 'Renaissance' wörtlich?", "Wiedergeburt (der Antike)",
     ["Aufbruch", "Untergang", "Reform"], "Die Renaissance besann sich auf antike Vorbilder."),
    ("Mit wem verbindet man den Absolutismus in Frankreich?", "Ludwig XIV.",
     ["Napoleon", "Karl dem Großen", "Bismarck"], "'Der Staat bin ich' wird Ludwig XIV. zugeschrieben."),
    ("Was kennzeichnet den Imperialismus im 19. Jahrhundert?", "das Streben nach Kolonien und Weltmacht",
     ["die Abschaffung von Grenzen", "den Verzicht auf Macht", "die Demokratie"], "Europäische Mächte teilten Afrika und Asien unter sich auf."),
    ("Ab wann rechnet man üblicherweise die Neuzeit?", "ab etwa 1500",
     ["ab 500", "ab 1000", "ab 1800"], "Buchdruck, Entdeckungen und Reformation leiteten die Neuzeit ein."),
], "Große Epochen der europäischen Geschichte.", "Bildungsplan Geschichte.")

fact_block("Biologie", "Zellen, Gene & Körper", "mittel", [
    ("Welche Zellen besitzen keinen echten Zellkern?", "Bakterien (Prokaryoten)",
     ["Pflanzenzellen", "Tierzellen", "Pilzzellen"], "Prokaryoten haben freie DNA ohne Kernhülle."),
    ("Warum gelten Viren nicht als 'richtige' Lebewesen?", "sie haben keinen eigenen Stoffwechsel",
     ["sie sind zu groß", "sie bestehen aus Metall", "sie atmen"], "Viren brauchen eine Wirtszelle zur Vermehrung."),
    ("Was ist ein Gen?", "ein Abschnitt der DNA mit einer Erbinformation",
     ["ein Organ", "eine Zelle", "ein Hormon"], "Gene codieren meist für Proteine."),
    ("Was versteht man unter dem Phänotyp?", "das äußere Erscheinungsbild eines Lebewesens",
     ["die Gesamtheit der Gene", "ein Organ", "eine Krankheit"], "Der Genotyp ist die genetische Ausstattung."),
    ("Welche Flüssigkeit bildet den größten Teil des Blutes?", "Blutplasma",
     ["Galle", "Lymphe", "Speichel"], "Im Plasma schwimmen die Blutzellen."),
    ("Was sind Hormone?", "Botenstoffe, die Körpervorgänge steuern",
     ["Bausteine der Knochen", "Verdauungsabfälle", "rote Blutkörperchen"], "Hormone werden von Drüsen ausgeschüttet."),
    ("Wozu dient das Skelett?", "zur Stütze und zum Schutz des Körpers",
     ["zur Verdauung", "zur Atmung", "zum Sehen"], "Knochen schützen z. B. Gehirn und Herz."),
], "Zellen, Genetik und Körperbau.", "Bildungsplan Biologie.")

fact_block("Mathematik", "Geometrie & Teilbarkeit", "mittel", [
    ("Wie berechnet man die Fläche eines Parallelogramms?", "Grundseite × Höhe",
     ["Grundseite × Höhe / 2", "Seite²", "πr²"], "A = g · h."),
    ("Woran erkennt man die Teilbarkeit einer Zahl durch 3?", "die Quersumme ist durch 3 teilbar",
     ["die letzte Ziffer ist gerade", "sie endet auf 0", "sie ist zweistellig"], "Beispiel: 123 → 1+2+3=6, teilbar durch 3."),
    ("Was bedeutet es, wenn zwei Figuren 'kongruent' sind?", "sie stimmen in Form und Größe überein",
     ["sie haben nur gleiche Form", "sie sind gespiegelt verschieden", "sie sind unterschiedlich groß"], "Kongruente Figuren sind deckungsgleich."),
    ("Was ist die Primfaktorzerlegung von 12?", "2 · 2 · 3",
     ["2 · 6", "3 · 4", "1 · 12"], "Primfaktorzerlegung nutzt nur Primzahlen: 12 = 2²·3."),
    ("Was ist 0,5 in Prozent?", "50 %",
     ["5 %", "0,5 %", "500 %"], "0,5 = 50/100 = 50 %."),
    ("Was ergibt a⁻² (a ≠ 0)?", "1/a²",
     ["a²", "−2a", "2a"], "Ein negativer Exponent bedeutet den Kehrwert."),
], "Flächen, Teilbarkeit und Rechenregeln.", "Formelsammlung Mathematik.")

fact_block("Latein", "Grammatik", "mittel", [
    ("Welcher Kasus ist typischerweise der Subjektfall?", "Nominativ",
     ["Akkusativ", "Dativ", "Ablativ"], "Das Subjekt steht im Nominativ."),
    ("Mit welchem Kasus fragt man 'wessen'?", "Genitiv",
     ["Dativ", "Akkusativ", "Nominativ"], "Der Genitiv drückt oft Zugehörigkeit aus."),
    ("Mit welchem Kasus fragt man 'wem'?", "Dativ",
     ["Genitiv", "Akkusativ", "Ablativ"], "Der Dativ ist der Fall des indirekten Objekts."),
    ("Welchen Kasus nutzt Latein oft für 'womit/wodurch'?", "Ablativ",
     ["Nominativ", "Genitiv", "Vokativ"], "Der Ablativ hat viele Funktionen (Mittel, Ort, Zeit)."),
    ("Was bedeutet 'amo'?", "ich liebe",
     ["du liebst", "er liebt", "wir lieben"], "amo, amas, amat … (a-Konjugation)."),
    ("Wie lautet die Genitiv-Endung der a-Deklination (Singular)?", "-ae",
     ["-us", "-i", "-em"], "z. B. puella – puellae."),
], "Grundlagen der lateinischen Grammatik.", "Bildungsplan Latein.")

fact_block("Französisch", "Grammatik", "mittel", [
    ("Wie bildet man die Verneinung im Französischen (Grundform)?", "mit 'ne … pas' um das Verb",
     ["nur mit 'non'", "mit '-s' am Verb", "gar nicht"], "Beispiel: 'Je ne mange pas.'"),
    ("Was bedeutet das Fragewort 'où'?", "wo",
     ["wann", "wer", "warum"], "'Où habites-tu?' = Wo wohnst du?"),
    ("Was bedeutet das Fragewort 'quand'?", "wann",
     ["wo", "wie", "wer"], "'Quand arrives-tu?' = Wann kommst du an?"),
    ("Womit bildet man das 'futur composé' (nahe Zukunft)?", "aller + Infinitiv",
     ["avoir + Partizip", "être + -ant", "ne + pas"], "Beispiel: 'Je vais manger.'"),
    ("Mit welchen Hilfsverben bildet man das 'passé composé'?", "avoir oder être",
     ["aller", "pouvoir", "vouloir"], "Die meisten Verben nutzen 'avoir', Bewegungsverben oft 'être'."),
    ("Was ist 'mon' für eine Wortart?", "ein Possessivbegleiter (mein)",
     ["ein Artikel", "ein Verb", "eine Präposition"], "mon/ma/mes richten sich nach dem Bezugswort."),
], "Grundlagen der französischen Grammatik.", "Bildungsplan Französisch.")

fact_block("Ethik/Philosophie", "Schulen & Denker", "schwer", [
    ("Welche antike Schule strebt nach Gelassenheit und Vernunftgemäßheit?", "die Stoa",
     ["der Hedonismus", "die Sophistik", "der Idealismus"], "Stoiker wie Seneca lehrten innere Ruhe (Ataraxie)."),
    ("Wer lehrte, Lust (in Maßen) sei das höchste Gut?", "Epikur",
     ["Kant", "Platon", "Descartes"], "Der Epikureismus strebt nach dauerhaftem Seelenfrieden."),
    ("Welcher chinesische Denker prägte eine Ethik der sozialen Ordnung?", "Konfuzius",
     ["Buddha", "Sokrates", "Nietzsche"], "Konfuzius betonte Tugend, Respekt und Harmonie."),
    ("Wie nennt man die Lehre, dass nur Sinneserfahrung Erkenntnis liefert?", "Empirismus",
     ["Rationalismus", "Idealismus", "Nihilismus"], "Der Rationalismus betont dagegen die Vernunft."),
    ("Welche Ethik bewertet Handlungen nach ihren Folgen?", "Konsequentialismus",
     ["Pflichtethik", "Tugendethik", "Gesinnungsethik"], "Der Utilitarismus ist eine Form des Konsequentialismus."),
], "Philosophische Schulen und Denker.", "Bildungsplan Ethik/Philosophie.")

fact_block("Chemie", "Vertiefung", "schwer", [
    ("Was besagt die Oktettregel?", "Atome streben acht Außenelektronen an",
     ["Atome haben acht Kerne", "Es gibt acht Elemente", "Moleküle sind achteckig"], "Edelgaskonfiguration ist besonders stabil."),
    ("Welchen pH-Wert hat reines Wasser bei 25 °C?", "7 (neutral)",
     ["0", "1", "14"], "Bei pH 7 sind H₃O⁺- und OH⁻-Ionen im Gleichgewicht."),
    ("Was ist ein Indikator (z. B. Lackmus)?", "ein Farbstoff, der Säuren/Basen anzeigt",
     ["ein Katalysator", "ein Metall", "ein Gas"], "Lackmus wird im Sauren rot, im Basischen blau."),
    ("Welche Bindung herrscht zwischen Metallatomen?", "die Metallbindung (Elektronengas)",
     ["Ionenbindung", "Wasserstoffbrücke", "keine"], "Frei bewegliche Elektronen machen Metalle leitfähig."),
    ("Was ist die molare Masse von Wasser (H₂O) ungefähr?", "18 g/mol",
     ["2 g/mol", "16 g/mol", "32 g/mol"], "2·1 + 16 = 18 g/mol."),
], "Vertiefende Chemie-Konzepte.", "Bildungsplan Chemie Oberstufe.")

fact_block("Physik", "Vertiefung", "schwer", [
    ("Was besagt der Energieerhaltungssatz?", "Energie geht nicht verloren, sondern wandelt sich nur um",
     ["Energie entsteht aus dem Nichts", "Energie verschwindet", "Energie ist konstant null"], "Die Gesamtenergie eines abgeschlossenen Systems bleibt konstant."),
    ("Welche Energieform hat ein hochgehobener Stein?", "Lageenergie (potenzielle Energie)",
     ["Bewegungsenergie", "Wärme", "elektrische Energie"], "E_pot = m·g·h."),
    ("Was unterscheidet Gleich- und Wechselstrom?", "Wechselstrom ändert periodisch seine Richtung",
     ["Gleichstrom ist stärker", "Wechselstrom fließt nie", "es gibt keinen Unterschied"], "Das Stromnetz liefert Wechselstrom (50 Hz)."),
    ("Was beschreibt die Halbwertszeit?", "die Zeit, in der die Hälfte der Atomkerne zerfällt",
     ["die Lebensdauer eines Menschen", "die Hälfte der Masse", "die Lichtgeschwindigkeit"], "Sie ist charakteristisch für ein Isotop."),
    ("Welche Kraft hält Planeten auf ihrer Bahn?", "die Gravitationskraft",
     ["die Reibung", "die elektrische Kraft", "der Luftdruck"], "Die Schwerkraft wirkt zwischen allen Massen."),
], "Vertiefende Physik-Konzepte.", "Gerthsen Physik.")

print("Vertiefungen geladen")

_en_vocab4 = [
    ("Morgen (Tageszeit)", "morning"), ("Abend", "evening"), ("Woche", "week"),
    ("Monat", "month"), ("Stunde", "hour"), ("Minute", "minute"), ("heute", "today"),
    ("morgen (adv.)", "tomorrow"), ("gestern", "yesterday"), ("immer", "always"),
    ("nie", "never"), ("oft", "often"), ("manchmal", "sometimes"), ("jetzt", "now"),
    ("Jahreszeit", "season"),
]
_en4_pool = [e for _, e in _en_vocab4]
for i, (de, en) in enumerate(_en_vocab4):
    _mk("Englisch", "Vokabeln (Zeit)", "leicht",
        f"Wie heißt '{de}' auf Englisch?",
        en, _others(en, _en4_pool[i+1:] + _en4_pool[:i]),
        i, f"'{de}' heißt auf Englisch '{en}'.",
        "Zeitangaben und Häufigkeitsadverbien sind wichtige Alltagswörter.",
        "Bildungsplan Englisch.", f"{de} – {en}.",
        f"Bilde einen Satz mit '{en}'.")

fact_block("Geographie", "Superlative & Gewässer", "mittel", [
    ("Welches ist der längste Fluss Europas?", "Wolga",
     ["Rhein", "Donau", "Themse"], "Die Wolga fließt durch Russland (ca. 3.530 km)."),
    ("Welcher ist der kleinste Kontinent?", "Australien",
     ["Europa", "Antarktika", "Südamerika"], "Australien ist der flächenkleinste Kontinent."),
    ("Wo liegt die tiefste Stelle der Weltmeere?", "im Marianengraben",
     ["im Mittelmeer", "in der Nordsee", "im Roten Meer"], "Der Marianengraben ist über 11 km tief."),
    ("Zwischen welchen Kontinenten liegt das Mittelmeer?", "Europa und Afrika",
     ["Asien und Amerika", "Afrika und Australien", "Amerika und Europa"], "Es grenzt im Norden an Europa, im Süden an Afrika."),
    ("Welche beiden Meere grenzen an Deutschland?", "Nordsee und Ostsee",
     ["Mittelmeer und Nordsee", "Ostsee und Schwarzes Meer", "Atlantik und Pazifik"], "Deutschland hat Küsten an Nord- und Ostsee."),
    ("Was ist ein Flussdelta?", "eine fächerförmige Flussündung ins Meer",
     ["eine Quelle", "ein Wasserfall", "ein See"], "Beispiel: das Nildelta."),
    ("In welcher Stadt sitzen wichtige EU-Institutionen (u. a. Kommission)?", "Brüssel",
     ["Paris", "Rom", "Madrid"], "Brüssel gilt als 'Hauptstadt der EU'."),
], "Geographische Superlative und Gewässer.", "Diercke Weltatlas.")

fact_block("Musik", "Gattungen", "leicht", [
    ("Was ist eine Sinfonie?", "ein großes mehrsätziges Orchesterwerk",
     ["ein Sologesang", "ein kurzes Lied", "ein Tanz"], "Sinfonien haben meist vier Sätze."),
    ("Was kennzeichnet eine Oper?", "Gesang, Orchester und Bühnenhandlung verbinden sich",
     ["nur Instrumentalmusik", "nur Sprechtheater", "nur Tanz"], "Die Oper vereint Musik und Drama."),
    ("Was bedeutet 'a cappella'?", "Gesang ohne Instrumentalbegleitung",
     ["sehr laut", "mit vollem Orchester", "sehr schnell"], "Nur Stimmen erklingen."),
    ("Wer leitet ein Orchester?", "der Dirigent / die Dirigentin",
     ["der Sänger", "der Komponist immer selbst", "das Publikum"], "Der Dirigent gibt Tempo und Einsatz vor."),
    ("Wie viele Schläge hat eine ganze Note im 4/4-Takt?", "vier",
     ["zwei", "eins", "acht"], "Eine ganze Note dauert vier Viertel."),
], "Musikalische Gattungen und Praxis.", "Bildungsplan Musik.")

fact_block("Kunst", "Gattungen & Technik", "leicht", [
    ("Was zeigt ein 'Stillleben'?", "unbewegte Gegenstände (z. B. Früchte, Gefäße)",
     ["eine Landschaft", "ein Porträt", "eine Schlacht"], "Stillleben waren besonders im Barock beliebt."),
    ("Was ist ein Porträt?", "die Darstellung einer bestimmten Person",
     ["ein Landschaftsbild", "ein abstraktes Muster", "eine Skulptur immer"], "Porträts erfassen oft Charakter und Ausdruck."),
    ("Wer gilt als berühmter Vertreter des Surrealismus?", "Salvador Dalí",
     ["Claude Monet", "Dürer", "Michelangelo"], "Dalí malte traumhaft-irreale Szenen."),
    ("Was ist ein Mosaik?", "ein Bild aus vielen kleinen Steinchen",
     ["eine Bleistiftskizze", "ein Ölgemälde", "ein Foto"], "Mosaike schmückten schon antike Böden."),
    ("Welche Technik ist die Radierung?", "ein Tiefdruckverfahren",
     ["eine Maltechnik mit Wasserfarbe", "eine Fototechnik", "eine Webtechnik"], "Die Zeichnung wird in eine Metallplatte geätzt."),
], "Kunstgattungen und Techniken.", "Bildungsplan Bildende Kunst.")

fact_block("Informatik", "Umgang mit dem Computer", "leicht", [
    ("Was ist eine Datei?", "eine benannte Sammlung zusammengehörender Daten",
     ["ein Kabel", "ein Bildschirm", "ein Netzwerk"], "Dateien werden in Ordnern organisiert."),
    ("Was ist ein Cookie im Internet?", "eine kleine Datei, die Webseiten im Browser speichern",
     ["ein Virus", "ein Programm", "ein Drucker"], "Cookies merken sich z. B. Einstellungen."),
    ("Warum sollte ein Passwort sicher sein?", "um unbefugten Zugriff zu verhindern",
     ["um schneller zu tippen", "aus Spaß", "um Strom zu sparen"], "Lange, komplexe Passwörter sind sicherer."),
    ("Was bedeutet 'Download'?", "Daten aus dem Netz auf das eigene Gerät laden",
     ["Daten löschen", "Daten hochladen", "Daten drucken"], "Beim Upload ist es umgekehrt."),
    ("Wozu dient ein Software-Update?", "zur Verbesserung und Fehlerbehebung von Programmen",
     ["zum Löschen des Geräts", "zum Abschalten des Internets", "zum Drucken"], "Updates schließen oft auch Sicherheitslücken."),
], "Sicherer Umgang mit Computer und Internet.", "Bildungsplan Informatik.")

fact_block("Geschichte", "Überblickswissen", "leicht", [
    ("In welchem Land stehen die berühmten Pyramiden von Gizeh?", "Ägypten",
     ["Griechenland", "Mexiko", "Irak"], "Die Pyramiden sind Grabmäler der Pharaonen."),
    ("In welcher Stadt entstand die antike Demokratie?", "Athen",
     ["Rom", "Sparta", "Theben"], "Athen gilt als Wiege der Demokratie."),
    ("Was waren die Kreuzzüge?", "mittelalterliche Militärzüge ins Heilige Land",
     ["Handelsreisen der Neuzeit", "Olympische Spiele", "Seefahrten nach Amerika"], "Sie begannen Ende des 11. Jahrhunderts."),
    ("Wer entwickelte um 1450 den Buchdruck mit beweglichen Lettern?", "Johannes Gutenberg",
     ["Martin Luther", "Leonardo da Vinci", "Kolumbus"], "Der Buchdruck beschleunigte die Verbreitung von Wissen."),
    ("Welche Partei beherrschte die DDR?", "die SED",
     ["die CDU", "die SPD", "die FDP"], "Die SED war die Staatspartei der DDR."),
], "Historisches Überblickswissen.", "Bildungsplan Geschichte.")

fact_block("Sport", "Gesundheit & Disziplinen", "leicht", [
    ("Welche Disziplin gehört zur Leichtathletik?", "Weitsprung",
     ["Schwimmen", "Turnen", "Radfahren"], "Leichtathletik umfasst Laufen, Springen und Werfen."),
    ("Was bedeutet 'Fairplay'?", "faires, regelgerechtes und respektvolles Verhalten",
     ["möglichst hart spielen", "schummeln", "aufgeben"], "Fairplay ist ein Grundwert des Sports."),
    ("Was fördert regelmäßige Bewegung vor allem?", "die Gesundheit und Fitness",
     ["Krankheiten", "Muskelabbau", "schlechten Schlaf"], "Sport stärkt Herz, Kreislauf und Psyche."),
    ("Welcher Schwimmstil wird in Rückenlage geschwommen?", "das Rückenschwimmen",
     ["das Brustschwimmen", "das Kraulen", "der Delfin"], "Beim Rückenschwimmen liegt man auf dem Rücken."),
], "Gesundheit, Werte und Disziplinen im Sport.", "Bildungsplan Sport.")

print("Top-up-Block geladen")

fact_block("Deutsch", "Abschluss-Wissen", "mittel", [
    ("Was ist eine Kurzgeschichte typischerweise?", "eine kurze Prosaerzählung mit offenem Anfang und Ende",
     ["ein langes Versepos", "ein Sachtext", "ein Drama in fünf Akten"], "Sie steigt oft unmittelbar ins Geschehen ein."),
    ("Was ist ein Antonym zu 'hell'?", "dunkel",
     ["grell", "licht", "klar"], "Antonyme sind Gegensatzpaare."),
    ("Welche Erzählperspektive liegt bei 'Ich ging nach Hause' vor?", "Ich-Erzähler",
     ["auktorialer Erzähler", "neutraler Erzähler", "personaler Er-Erzähler"], "Der Erzähler ist Teil der Handlung."),
    ("Was ist ein Protagonist?", "die Hauptfigur einer Handlung",
     ["der Erzähler", "der Gegenspieler", "der Autor"], "Der Gegenspieler ist der Antagonist."),
], "Zentrale Begriffe für die Textarbeit.", "Bildungsplan Deutsch.")

fact_block("Politik", "Grundwissen", "leicht", [
    ("Was ist ein Grundrecht?", "ein im Grundgesetz garantiertes Recht jedes Menschen",
     ["ein Gesetz nur für Beamte", "eine Steuer", "ein Parteiprogramm"], "Grundrechte binden die staatliche Gewalt."),
    ("Was bedeutet 'Souveränität' eines Staates?", "seine oberste, unabhängige Entscheidungsgewalt",
     ["seine Verschuldung", "seine Größe", "seine Einwohnerzahl"], "Ein souveräner Staat ist von anderen unabhängig."),
    ("Was ist das Wahlgeheimnis?", "niemand darf erfahren, wie man gewählt hat",
     ["man muss öffentlich wählen", "nur Reiche dürfen wählen", "man wählt zweimal"], "Wahlen sind allgemein, frei, gleich, geheim und unmittelbar."),
], "Grundbegriffe der politischen Bildung.", "Bildungsplan Gemeinschaftskunde.")

fact_block("Wirtschaft", "Abschluss-Wissen", "mittel", [
    ("Was ist ein Zins?", "der Preis für geliehenes Geld",
     ["eine Steuer", "ein Rabatt", "ein Lohn"], "Zinsen werden in Prozent pro Jahr angegeben."),
    ("Was beschreibt Angebot und Nachfrage am Arbeitsmarkt?", "das Verhältnis von freien Stellen und Arbeitssuchenden",
     ["die Zahl der Feiertage", "die Steuerhöhe", "das Wetter"], "Es beeinflusst Löhne und Beschäftigung."),
    ("Was ist ein Budget?", "ein geplanter Finanzrahmen für Einnahmen und Ausgaben",
     ["ein Kredit", "eine Aktie", "eine Währung"], "Haushalte, Firmen und Staaten planen mit Budgets."),
], "Grundbegriffe der Wirtschaft.", "Bildungsplan Wirtschaft.")

fact_block("Religion", "Abschluss-Wissen", "leicht", [
    ("Aus welchen zwei Hauptteilen besteht die christliche Bibel?", "Altes und Neues Testament",
     ["Tora und Koran", "Suren und Psalmen", "Erde und Himmel"], "Das Neue Testament berichtet von Jesus."),
    ("Wie heißen die Kapitel des Korans?", "Suren",
     ["Psalmen", "Verse allein", "Gebote"], "Der Koran besteht aus 114 Suren."),
    ("Welche Religion hat weltweit die meisten Anhänger?", "das Christentum",
     ["der Buddhismus", "das Judentum", "der Hinduismus"], "Das Christentum ist die größte Weltreligion."),
], "Überblickswissen zu Religionen.", "Bildungsplan Religion.")

fact_block("Ethik/Philosophie", "Abschluss-Wissen", "mittel", [
    ("Was bedeutet 'Toleranz'?", "das Dulden und Respektieren anderer Überzeugungen",
     ["Gleichgültigkeit", "Zwang", "Ablehnung"], "Toleranz ist Grundlage eines friedlichen Zusammenlebens."),
    ("Was ist 'Verantwortung'?", "für die Folgen des eigenen Handelns einstehen",
     ["ein Besitz", "ein Gefühl von Angst", "eine Strafe"], "Verantwortung setzt Entscheidungsfreiheit voraus."),
    ("Was untersucht die Ethik als philosophische Disziplin?", "das moralisch gute Handeln",
     ["die Natur der Sterne", "die Grammatik", "die Wirtschaft"], "Ethik fragt, was richtig und gut ist."),
], "Grundbegriffe der Ethik.", "Bildungsplan Ethik.")

fact_block("Informatik", "Abschluss-Wissen", "leicht", [
    ("Was beschreibt der Begriff 'Betriebssystem'?", "die grundlegende Software, die den Computer steuert",
     ["ein Spiel", "ein Kabel", "eine Webseite"], "Beispiele: Windows, macOS, Linux."),
    ("Was ist das Internet?", "ein weltweites Netzwerk verbundener Computer",
     ["ein einzelnes Programm", "ein Drucker", "eine Festplatte"], "Darauf baut u. a. das World Wide Web auf."),
    ("Was macht eine Suchmaschine?", "sie durchsucht das Web und liefert passende Treffer",
     ["sie druckt Dokumente", "sie löscht Dateien", "sie kühlt den PC"], "Beispiele: Google, Bing, DuckDuckGo."),
], "Grundlagen zu Computern und Internet.", "Bildungsplan Informatik.")

fact_block("Mathematik", "Abschluss-Wissen", "leicht", [
    ("Wie nennt man das Ergebnis einer Addition?", "Summe",
     ["Differenz", "Produkt", "Quotient"], "Addition → Summe, Subtraktion → Differenz."),
    ("Wie nennt man das Ergebnis einer Multiplikation?", "Produkt",
     ["Summe", "Quotient", "Rest"], "Multiplikation → Produkt, Division → Quotient."),
    ("Wie viele Grad hat ein Vollkreis?", "360°",
     ["180°", "90°", "270°"], "Ein Vollwinkel misst 360°."),
], "Mathematische Grundbegriffe.", "Bildungsplan Mathematik.")

fact_block("Physik", "Abschluss-Wissen", "leicht", [
    ("In welchem Aggregatzustand haben Teilchen am meisten Bewegungsfreiheit?", "gasförmig",
     ["fest", "flüssig", "alle gleich"], "Im Gas bewegen sich Teilchen frei und schnell."),
    ("Was zieht ein Magnet an?", "Gegenstände aus Eisen, Nickel oder Kobalt",
     ["Holz", "Glas", "Kunststoff"], "Diese Stoffe sind ferromagnetisch."),
], "Physikalisches Grundwissen.", "Bildungsplan Physik.")

print("Abschluss-Block geladen")
# ==INSERT_QUESTIONS_HERE==

if __name__ == "__main__":
    # Auf genau 1000 Fragen begrenzen und IDs neu durchnummerieren.
    Q[:] = Q[:1000]
    for new_id, q in enumerate(Q, start=1):
        q["id"] = new_id
    out = "questions_gymnasium.json"
    payload = {
        "meta": {
            "title": "Gymnasium Abitur – 1000 Multiple-Choice-Fragen",
            "language": "de",
            "count": len(Q),
            "schema": ["id", "subject", "topic", "difficulty", "question",
                       "options", "correct", "explanation", "more_info",
                       "reference", "example", "open_question"],
        },
        "questions": Q,
    }
    with open(out, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    # validate round-trip
    with open(out, "r", encoding="utf-8") as f:
        json.load(f)
    print(f"Wrote {len(Q)} questions to {out}")
    # subject distribution
    from collections import Counter
    for s, n in Counter(x["subject"] for x in Q).most_common():
        print(f"  {s}: {n}")
