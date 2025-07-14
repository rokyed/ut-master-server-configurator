# UT3 Master Server Configurator

This project provides a static web page to help you update your Unreal Tournament 3 configuration files to use a new master server.

## Usage

1. Open `index.html` in a modern browser or visit the GitHub Pages site after deployment.
2. Select your local UT3 **installation folder** or your **user config folder** when prompted.
   The app automatically detects `UTEngine.ini`/`UTGame.ini` or `DefaultEngine.ini`/`DefaultUI.ini`
   and updates whichever files are present.
   Example paths:
   - **Game Install (Windows):** `C:\Program Files (x86)\Unreal Tournament 3`
   - **Game Install (Steam):** `C:\Program Files (x86)\Steam\steamapps\common\Unreal Tournament 3`
   - **User Config (Windows):** `%USERPROFILE%\Documents\My Games\Unreal Tournament 3`
   - **User Config (Steam/Proton):** `/steamapps/compatdata/13230/pfx/drive_c/users/steamuser/My Documents/My Games/Unreal Tournament 3`
3. Review the detected configuration.
4. Enter the new master server URL and port, choose whether to advertise the server, then apply the changes.
5. Download the modified INI files and replace them in your UT3 install (back up the originals first).

## Deployment

Push the contents of this repository to a GitHub repository and enable GitHub Pages. The site is completely static and requires no server-side code.
