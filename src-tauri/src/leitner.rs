//! Metodo Leitner a 5 scatole. Intervalli in giorni per scatola.
pub const INTERVALS: [i64; 5] = [1, 2, 4, 8, 16];

/// Risposta giusta: sali di una scatola (max 5). Sbagliata: torni alla 1.
/// Restituisce (nuova scatola, giorni al prossimo ripasso).
pub fn next_state(box_n: u8, correct: bool) -> (u8, i64) {
    let b = box_n.clamp(1, 5);
    let new_box = if correct { (b + 1).min(5) } else { 1 };
    (new_box, INTERVALS[(new_box - 1) as usize])
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn giusta_sale() { assert_eq!(next_state(1, true), (2, 2)); }
    #[test]
    fn sbagliata_torna_a_uno() { assert_eq!(next_state(4, false), (1, 1)); }
    #[test]
    fn massimo_cinque() { assert_eq!(next_state(5, true), (5, 16)); }
}
