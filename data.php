<?php

header('Content-Type: application/json');

// {"id": 1, "name": "iPhone 7", "price": "7999", "status": 1},
// {"id": 2, "name": "Galaxy Note 7", "price": "2300", "status": 0},

$len = 10;
$data = [];
$start = intval($_GET['page'] - 1) * $len + 1;

for ($i=0; $i < 10; $i++) {
	if($i + $start > 105) break;
	$data[] = [
		'id' => $i + $start,
		'name' => substr(md5(microtime(true)), 0, 6),
		'price' => rand(1000, 9000),
		'status' => rand(0, 1),
	];
}

echo json_encode([
	'totalCount' => 105,
	'data' => $data,
]);