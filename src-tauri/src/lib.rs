mod leitner;

#[tauri::command]
fn leitner_preview(box_n: u8, correct: bool) -> (u8, i64) {
    // Anteprima: da quale scatola parti, risposta giusta/sbagliata -> (nuova scatola, giorni al prossimo ripasso)
    leitner::next_state(box_n, correct)
}

/// Aspetta una sola richiesta HTTP locale (il ritorno di Google dopo l'accesso) e ne restituisce la prima riga.
#[tauri::command]
async fn oauth_wait(port: u16, path: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        use std::io::{Read, Write};
        use std::net::TcpListener;
        use std::time::{Duration, Instant};
        let listener = TcpListener::bind(("127.0.0.1", port))
            .map_err(|e| format!("Porta {} occupata (chiudi NutriEvolution e riprova): {}", port, e))?;
        listener.set_nonblocking(true).map_err(|e| e.to_string())?;
        let start = Instant::now();
        loop {
            match listener.accept() {
                Ok((mut stream, _)) => {
                    stream.set_nonblocking(false).ok();
                    stream.set_read_timeout(Some(Duration::from_secs(5))).ok();
                    let mut buf = [0u8; 4096];
                    let n = stream.read(&mut buf).unwrap_or(0);
                    let req = String::from_utf8_lossy(&buf[..n]).to_string();
                    let line = req.lines().next().unwrap_or("").to_string();
                    let body = "<html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"></head><body style=\"font-family:sans-serif;background:#0b0d14;color:#eee;text-align:center;padding-top:20vh\"><h2>Accesso completato</h2><p>Puoi tornare a Studio.</p></body></html>";
                    let resp = format!(
                        "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                        body.len(),
                        body
                    );
                    let _ = stream.write_all(resp.as_bytes());
                    if line.contains(&path) {
                        return Ok(line);
                    }
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    if start.elapsed() > Duration::from_secs(180) {
                        return Err("Tempo scaduto: accesso non completato".to_string());
                    }
                    std::thread::sleep(Duration::from_millis(100));
                }
                Err(e) => return Err(e.to_string()),
            }
        }
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![leitner_preview, oauth_wait])
        .run(tauri::generate_context!())
        .expect("errore nell'avvio di Studio");
}
