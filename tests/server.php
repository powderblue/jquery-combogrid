<?php

echo json_encode([
    'page' => 1,  // Current page number
    'total' => 1,  // Number of pages
    'records' => 1,  // Total number of records
    'rows' => [
        [
            'id' => 1,
            'name' => 'Strange Case of Dr Jekyll and Mr Hyde',
            'author' => 'Robert Louis Stevenson',
        ],
        [
            'id' => 2,
            'name' => 'A Scanner Darkly',
            'author' => 'Philip K. Dick',
        ],
    ],
]);
