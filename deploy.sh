#!/data/data/com.termux/files/usr/bin/sh
cd ~/tikgrowth || exit 1
git config user.name "zongojairus65"
git config user.email "zongojairus65@users.noreply.github.com"
git add -A
git commit -m "${1:-Mise à jour}" || echo "Rien de nouveau à envoyer"
git branch -M main
git push -u origin main
