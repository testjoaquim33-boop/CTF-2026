// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title DiplomaRegistry
 * @notice Système de vérification de diplômes sur blockchain Ethereum
 * TP3 — Université
 */
contract DiplomaRegistry {

    // ================================================================
    //  ÉTAT DU CONTRAT
    // ================================================================

    address public owner;
    uint public diplomaCount;

    // Structure d'un diplôme (Partie 2)
    struct Diploma {
        string  studentName;  // Nom de l'étudiant
        bytes32 diplomaHash;  // Empreinte cryptographique du PDF
        uint    issuedAt;     // Timestamp d'émission (block.timestamp)
        bool    revoked;      // true = révoqué
    }

    // Stockage : identifiant (uint) => Diploma
    mapping(uint => Diploma) private diplomas;

    // Bonus 2 : empêcher les doublons de hash
    mapping(bytes32 => bool) private hashUsed;

    // ================================================================
    //  ÉVÉNEMENTS (Partie 5)
    // ================================================================

    event DiplomaIssued(
        uint indexed diplomaId,
        string studentName,
        bytes32 diplomaHash,
        uint issuedAt
    );

    event DiplomaRevoked(
        uint indexed diplomaId,
        string studentName,
        uint revokedAt
    );

    // ================================================================
    //  MODIFICATEURS (Partie 4)
    // ================================================================

    modifier onlyOwner() {
        require(msg.sender == owner, "Acces refuse : vous n'etes pas l'administrateur");
        _;
    }

    modifier diplomaExists(uint _id) {
        require(_id > 0 && _id <= diplomaCount, "Diplome introuvable");
        _;
    }

    // ================================================================
    //  CONSTRUCTEUR
    // ================================================================

    constructor() {
        owner = msg.sender;
        diplomaCount = 0;
    }

    // ================================================================
    //  PARTIE 3 — FONCTIONNALITÉS OBLIGATOIRES
    // ================================================================

    /**
     * @notice Émettre un diplôme (réservé à l'administrateur)
     * @param _studentName  Nom complet de l'étudiant
     * @param _rawHash      Hash SHA-256 du PDF (fourni en bytes32)
     *
     * Gas estimé : ~85 000 (première émission)
     */
    function issueDiploma(string memory _studentName, bytes32 _rawHash)
        public
        onlyOwner
    {
        require(bytes(_studentName).length > 0, "Le nom de l'etudiant est obligatoire");
        require(_rawHash != bytes32(0), "Le hash du diplome est invalide");

        // Bonus 2 : anti-doublon
        require(!hashUsed[_rawHash], "Ce hash a deja ete enregistre");

        // keccak256 : re-hashage interne pour l'identifiant
        bytes32 internalKey = keccak256(abi.encodePacked(_rawHash, diplomaCount + 1));
        require(internalKey != bytes32(0), "Erreur interne de hachage");

        diplomaCount++;

        diplomas[diplomaCount] = Diploma({
            studentName: _studentName,
            diplomaHash: _rawHash,
            issuedAt:    block.timestamp,
            revoked:     false
        });

        hashUsed[_rawHash] = true;

        emit DiplomaIssued(diplomaCount, _studentName, _rawHash, block.timestamp);
    }

    /**
     * @notice Vérifier l'authenticité d'un diplôme
     * @param _id        Identifiant du diplôme
     * @param _hashCheck Hash à comparer (fourni par le vérificateur)
     * @return true si le diplôme existe, le hash correspond et n'est pas révoqué
     */
    function verifyDiploma(uint _id, bytes32 _hashCheck)
        public
        view
        diplomaExists(_id)
        returns (bool)
    {
        Diploma memory d = diplomas[_id];

        if (d.revoked)                  return false;
        if (d.diplomaHash != _hashCheck) return false;

        return true;
    }

    /**
     * @notice Révoquer un diplôme (réservé à l'administrateur)
     * @param _id  Identifiant du diplôme à révoquer
     */
    function revokeDiploma(uint _id)
        public
        onlyOwner
        diplomaExists(_id)
    {
        require(!diplomas[_id].revoked, "Ce diplome est deja revoque");

        diplomas[_id].revoked = true;

        emit DiplomaRevoked(_id, diplomas[_id].studentName, block.timestamp);
    }

    // ================================================================
    //  BONUS 1 — Récupérer les infos d'un diplôme par son ID
    // ================================================================

    /**
     * @notice Retourne les informations complètes d'un diplôme
     * @param _id  Identifiant du diplôme
     */
    function getDiploma(uint _id)
        public
        view
        diplomaExists(_id)
        returns (
            string memory studentName,
            bytes32 diplomaHash,
            uint    issuedAt,
            bool    revoked
        )
    {
        Diploma memory d = diplomas[_id];
        return (d.studentName, d.diplomaHash, d.issuedAt, d.revoked);
    }

    /**
     * @notice Retourne le nombre total de diplômes émis
     */
    function getTotalDiplomas() public view returns (uint) {
        return diplomaCount;
    }
}
