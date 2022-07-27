#!/usr/bin/env bash
# https://github.com/bitwarden/directory-connector/issues/17#issuecomment-499935581
sudo apt-get update && sudo apt-get install -y libsecret-1-0 dbus-x11 gnome-keyring
export $(dbus-launch)
dbus-launch
gnome-keyring-daemon --start --daemonize --components=secrets
echo 'neil' | gnome-keyring-daemon -r -d --unlock
