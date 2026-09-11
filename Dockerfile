# Miya's Cookies — production image (PHP 8.3 + Apache).
# Used by Render / Railway / Fly to deploy straight from the GitHub repo.
FROM php:8.3-apache

RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev \
    && docker-php-ext-install pdo_pgsql pdo_mysql \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf
COPY . /var/www/html/

# Render injects $PORT; Apache must listen on it.
RUN mkdir -p /var/www/html/data && chown -R www-data:www-data /var/www/html/data
CMD ["sh", "-c", "sed -i \"s/Listen 80/Listen ${PORT:-80}/\" /etc/apache2/ports.conf && sed -i \"s/:80>/:${PORT:-80}>/\" /etc/apache2/sites-available/000-default.conf && apache2-foreground"]
