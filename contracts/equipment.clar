;; Equipment Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))

;; Data Variables
(define-data-var last-equipment-id uint u0)

;; Data Maps
(define-map equipments
  { equipment-id: uint }
  {
    type: (string-ascii 50),
    manufacturer: (string-ascii 50),
    installation-date: uint,
    health-score: uint,
    status: (string-ascii 20)
  }
)

;; Public Functions

;; Add new equipment
(define-public (add-equipment (type (string-ascii 50)) (manufacturer (string-ascii 50)) (installation-date uint))
  (let
    (
      (new-id (+ (var-get last-equipment-id) u1))
    )
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (map-set equipments
      { equipment-id: new-id }
      {
        type: type,
        manufacturer: manufacturer,
        installation-date: installation-date,
        health-score: u100,
        status: "operational"
      }
    )
    (var-set last-equipment-id new-id)
    (ok new-id)
  )
)

;; Update equipment health score
(define-public (update-health-score (equipment-id uint) (new-health-score uint))
  (let
    (
      (equipment (unwrap! (map-get? equipments { equipment-id: equipment-id }) err-not-found))
    )
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (asserts! (<= new-health-score u100) err-unauthorized)
    (ok (map-set equipments
      { equipment-id: equipment-id }
      (merge equipment { health-score: new-health-score })
    ))
  )
)

;; Update equipment status
(define-public (update-status (equipment-id uint) (new-status (string-ascii 20)))
  (let
    (
      (equipment (unwrap! (map-get? equipments { equipment-id: equipment-id }) err-not-found))
    )
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (ok (map-set equipments
      { equipment-id: equipment-id }
      (merge equipment { status: new-status })
    ))
  )
)

;; Read-only functions

;; Get equipment details
(define-read-only (get-equipment (equipment-id uint))
  (ok (unwrap! (map-get? equipments { equipment-id: equipment-id }) err-not-found))
)

;; Get total number of equipment
(define-read-only (get-equipment-count)
  (ok (var-get last-equipment-id))
)

;; Initialize contract
(begin
  (var-set last-equipment-id u0)
)
