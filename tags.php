<?php

header('Content-Type: application/json');
usleep(500000);

echo json_encode([
	1 => 'tag11',
	2 => 'tag22',
	3 => 'tag33',
]);