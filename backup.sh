#!/bin/bash
echo "Creating UCAUTOTECH WMS migration archive..."
tar -czvf ucautotech_backup.tar.gz auth_info_baileys ucautotech.db index.js database.js package.json
echo "Backup complete: ucautotech_backup.tar.gz generated in ~/whatsapp_bridge"
