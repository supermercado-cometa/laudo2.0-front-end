#!/bin/bash

# 1. Pega a descrição do que foi feito
read -p "O que foi alterado nesta versão? " MESSAGE
TIMESTAMP=$(date +'%Y%m%d-%H%M')
TAG_NAME="milestone-$TIMESTAMP"

# 2. Faz o commit com a marca temporal
git add .
git commit -m "feat: $MESSAGE [Tag: $TAG_NAME]"

# 3. Cria uma tag local para facilitar o checkout futuro
git tag -a "$TAG_NAME" -m "$MESSAGE"

echo "✅ Commit realizado e marcado como: $TAG_NAME"
echo "------------------------------------------------"
echo "ÚLTIMOS MARCOS PARA VOLTAR (ROLLBACK):"
git log --oneline --graph --all -n 10
