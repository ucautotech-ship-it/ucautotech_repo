import os, time, requests
CFG = 'supabase_config.txt'
def cfg():
    if os.path.exists(CFG):
        with open(CFG) as f:
            k = f.read().strip()
            if k and input(f'Use existing key ending in ...{k[-6:]}? (y/n): ').strip().lower() == 'y': return k
    k = input('Paste your actual Supabase Anon/Service Key: ').strip()
    if k: open(CFG, 'w').write(k)
    return k
if __name__ == '__main__':
    k = cfg()
    if not k: exit(1)
    res = requests.post('https://wknwaumfwjlvrotobngf.supabase.co/rest/v1/telemetry', 
                        json={'vin': '1FA6P8CF0H5512345', 'dtc_active': 'P0300', 'engine_rpm': 2400, 'coolant_temp': 95.0, 'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')},
                        headers={'apikey': k, 'Authorization': f'Bearer {k}', 'Content-Type': 'application/json', 'Prefer': 'return=minimal'}, timeout=5)
    print(f'Status: {res.status_code} | Body: {res.text}')
