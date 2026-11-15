mod leitner;

#[tauri::command]
fn leitner_preview(box_n: u8, correct: bool) -> (u8, i64) {
    // Anteprima: da quale scatola parti, risposta giusta/sbagliata -> (nuova scatola, giorni al prossimo ripasso)
    leitner::next_state(box_n, correct)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![leitner_preview])
        .run(tauri::generate_context!())
        .expect("errore nell'avvio di Studio");
}
