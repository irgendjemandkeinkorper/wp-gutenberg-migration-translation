<?php

namespace Cet\Theme\Troon2\Admin;

class Notifier {

	public const ERROR   = 'error';
	public const SUCCESS = 'success';
	public const WARNING = 'warning';
	public const INFO    = 'info';

	private array $messages = [
		self::ERROR   => [],
		self::SUCCESS => [],
		self::WARNING => [],
		self::INFO    => [],
	];

	public function add( string $message, string $level = self::INFO ): void {
		$this->messages[ $level ][] = $message;
	}

	public function output(): void {
		foreach ( $this->messages as $level => $messages ) {
			if ( empty( $messages ) ) {
				continue;
			}

			printf(
				'<div class="notice notice-%s is-dismissible"><p>%s</p></div>',
				esc_attr( $level ),
				nl2br( esc_html( implode( PHP_EOL, $messages ) ) )
			);
		}
	}
}
