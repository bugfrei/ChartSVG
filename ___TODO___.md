# Todo
## Wichtig
- [ ] Achsenbeschriftung
      In Schritten: 1h Abstände, 30' Abstände, 10' Abstände, 5' Abstände, 1' Abstände, 10'' Abstände, 1' Abstände
      Jeweil prüfen, wieviele Pixel der Abstand ist, und wenn darstellbar (KONSTANTE NUTZEN), dann auch zeichnen

- [ ] Zoom Buttons (mit 3-4 Standard-Zoom Faktoren)
      Konfigurierbar über ChartManager.zoomButtons[]

- [ ] 0-Linie (bei negativen/positiven Werten) - per Parameter
      Konfigurierbar über KONSTANTE (Farbe, Opacity)

- [ ] Verschieben ganzer Markierungen

- [ ] Verschieben von Start/Ende der Markierungen
- [ ] Bearbeiten von Markierungen (Notizeingabe, Farbe/Typ; valid (wichtig bei ML Markierungen); löschen)


# Ideen

- [ ] Text "Zoom", "Notiz" und die Zeit (SS:MM:SS (xxxx s) so angeordnet, das auch bei einer Markierung mit Scrollen der Text sichtbar ist
      Also Entweder linksbündig, zentriert oder rechtsbündig, je nachdem welcher Teil im sichtbaren Bereich liegt
- [ ] Die Zeitangabe (SS:MM:SS (xxxx s) beim ResizeSelectionRect aktualisieren)
- [ ] Die Zeitangabe (SS:MM:SS (xxxx s) die Sekundenzahl durch Minuten ändern wenn > 90 Sekunden (xxxx m)
- [ ] Beschriftunngen der Markierungen immer sichtbar (beim scrollen neu Positionieren)
- [ ] MouseOver Markierung -> Beschriftung ausblenden