#!/bin/bash
# Rebuild all art + sound from the purchased kits (staged under /mnt/user-data/uploads/claude导出 and /tmp/packs)
set -e; cd "$(dirname "$0")"
python3 build_skins.py && python3 build_anims.py && python3 build_logos.py && python3 build_tables.py && python3 build_table_covers.py && python3 build_thumbs.py && python3 apply_sound_families.py
[ "$1" = "sound" ] && python3 build_sounds.py
echo all built
