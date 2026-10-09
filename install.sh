#!/usr/bin/env bash
# Установка / удаление / упаковка Dynamic Island для GNOME Shell.
#
#   ./install.sh            — установить (или обновить) и включить
#   ./install.sh --deps     — то же + поставить необязательные зависимости (apt/dnf/pacman)
#   ./install.sh --uninstall — выключить и удалить
#   ./install.sh --pack     — собрать zip для extensions.gnome.org / ручной установки
set -euo pipefail

UUID="dynamic-island@dynamiclinux"
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$UUID"
DEST="${XDG_DATA_HOME:-$HOME/.local/share}/gnome-shell/extensions/$UUID"

info() { printf '\033[1;34m•\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m✓\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!\033[0m %s\n' "$*"; }

install_deps() {
    info "Устанавливаю необязательные зависимости (OCR, запись звука)…"
    if command -v apt >/dev/null; then
        sudo apt install -y tesseract-ocr tesseract-ocr-rus tesseract-ocr-eng pipewire-bin alsa-utils
    elif command -v dnf >/dev/null; then
        sudo dnf install -y tesseract tesseract-langpack-rus pipewire-utils alsa-utils
    elif command -v pacman >/dev/null; then
        sudo pacman -S --needed tesseract tesseract-data-rus tesseract-data-eng pipewire alsa-utils
    else
        warn "Не удалось определить пакетный менеджер — поставьте tesseract вручную."
    fi
    if ! command -v whisper-cli >/dev/null; then
        warn "Для локального распознавания речи соберите whisper.cpp (см. README) или укажите API в настройках."
    fi
}

case "${1:-}" in
    --uninstall)
        gnome-extensions disable "$UUID" 2>/dev/null || true
        rm -rf "$DEST"
        ok "Расширение удалено. Данные (заметки, история) остались в ~/.local/share/dynamic-island"
        exit 0
        ;;
    --pack)
        command -v gnome-extensions >/dev/null || { warn "Нужна утилита gnome-extensions"; exit 1; }
        gnome-extensions pack "$SRC" --force --extra-source=lib --out-dir="$(dirname "$SRC")"
        ok "Готово: $(dirname "$SRC")/$UUID.shell-extension.zip"
        exit 0
        ;;
    --deps)
        install_deps
        ;;
esac

command -v glib-compile-schemas >/dev/null || { warn "Нужен glib-compile-schemas (пакет libglib2.0-bin)"; exit 1; }

info "Копирую расширение в $DEST"
rm -rf "$DEST"
mkdir -p "$DEST"
cp -r "$SRC"/. "$DEST"/
glib-compile-schemas "$DEST/schemas"
ok "Файлы установлены"

if gnome-extensions enable "$UUID" 2>/dev/null; then
    ok "Расширение включено"
else
    warn "GNOME Shell ещё не знает о новом расширении."
fi

if [ "${XDG_SESSION_TYPE:-}" = "wayland" ]; then
    warn "Wayland: выйдите из системы и войдите снова, затем выполните:"
    echo "    gnome-extensions enable $UUID"
else
    warn "X11: нажмите Alt+F2, введите r и Enter — затем при необходимости:"
    echo "    gnome-extensions enable $UUID"
fi
echo
ok "Горячие клавиши: Super+Alt+Space — раскрыть с поиском, Super+Alt+D — включить/выключить остров"
ok "Настройки: gnome-extensions prefs $UUID"
