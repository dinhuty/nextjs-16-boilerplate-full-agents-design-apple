-- 0004_seed_sql_snippets.sql
-- Seed the 60 built-in static SQL snippets ported from
-- acm-tools/database/api/src/sql-snippets as initial shared master data.
-- Dynamic .sql.ts builders are intentionally excluded (see design doc).
-- Idempotent: re-running does nothing thanks to the (tab, title) unique key.

insert into public.sql_snippets (tab, title, body) values
  ($snip$cart$snip$, $snip$clear-store$snip$, $snip$Delete from mall.store_carts where user_id = ${user_id};$snip$),
  ($snip$cart$snip$, $snip$clear$snip$, $snip$DELETE FROM mall.carts WHERE user_id = ${user_id};$snip$),
  ($snip$coupon$snip$, $snip$delete-coupon-relations-by-code$snip$, $snip$DELETE FROM coupon_relations
WHERE coupon_id IN (SELECT id FROM coupons WHERE code = 'auto70');$snip$),
  ($snip$coupon$snip$, $snip$view-coupons-by-item$snip$, $snip$SELECT cr.coupon_id, c.capacity, c.code, c.type, c.distribution_type
FROM coupon_relations AS cr
LEFT JOIN coupons AS c ON c.id = cr.coupon_id
WHERE c.start_date <= NOW()
  AND c.end_date >= NOW()
  AND cr.item_id = ${item_id}
  AND c.distribution_type = 1
GROUP BY cr.coupon_id
LIMIT 50;$snip$),
  ($snip$item$snip$, $snip$delete-item-campaigns$snip$, $snip$DELETE FROM item_campaigns WHERE item_id IN (${item_ids});$snip$),
  ($snip$item$snip$, $snip$force-stock-0$snip$, $snip$UPDATE items SET count = 0 WHERE id IN (${item_ids});$snip$),
  ($snip$item$snip$, $snip$force-stock-100$snip$, $snip$UPDATE items SET count = 100 WHERE id IN (${item_ids});$snip$),
  ($snip$item$snip$, $snip$insert-item-campaign$snip$, $snip$INSERT INTO item_campaigns (item_id, request_volume, available_volume, request_start_date, request_end_date)
VALUES (${item_id}, 1000, 1000, SUBDATE(NOW(), 7), ADDDATE(NOW(), 30));$snip$),
  ($snip$item$snip$, $snip$insert-item-groups-bulk$snip$, $snip$-- Wire items 1, 2, 3 as "type=2" related items pointing at item 4. Adjust ids freely.
INSERT INTO item_groups (item_id, related_item_id, type)
VALUES (${item_id_1}, ${related_item_id}, ${type});$snip$),
  ($snip$item$snip$, $snip$insert-item-price-history$snip$, $snip$-- Snapshot the current rental_price / original_price of an item into item_price_histories.
INSERT INTO item_price_histories (item_id, rental_price, original_price, price_version)
VALUES (${item_id},
        (SELECT rental_price FROM items WHERE id = ${item_id}),
        (SELECT original_price FROM items WHERE id = ${item_id}),
        ${price_version});$snip$),
  ($snip$item$snip$, $snip$top-items-last-90d$snip$, $snip$SELECT `item_id`, COUNT(`id`) AS `count`
FROM `rental_items` AS `RentalItem`
WHERE `RentalItem`.`cancel_flg` = 0
  AND `RentalItem`.`started_at` >= DATE_FORMAT(SUBDATE(NOW(), ${day}), '%Y-%m-%d')
GROUP BY `item_id`
ORDER BY COUNT(`id`) DESC, `RentalItem`.`item_id` DESC
LIMIT 50;$snip$),
  ($snip$item$snip$, $snip$update-item-tag$snip$, $snip$UPDATE item_tags
SET tag_id = ${tag_id}
WHERE item_id = ${item_id}
  AND price_version = ${price_version};$snip$),
  ($snip$pricing$snip$, $snip$effective-price-for-item$snip$, $snip$SELECT i.id,
       i.rental_price,
       c.discount_rate,
       c.discount_price,
       rp.plan_price
FROM items i
LEFT JOIN coupon_relations cp ON i.id = cp.item_id AND cp.rental_plan_id IS NULL
LEFT JOIN coupons c ON c.id = cp.coupon_id
                   AND c.start_date <= NOW()
                   AND c.end_date >= NOW()
                   AND c.type = 1
                   AND c.distribution_type = 1
LEFT JOIN rental_plan_items AS rpi ON rpi.item_id = i.id
LEFT JOIN rental_plans rp ON rp.id = rpi.item_id
                         AND rp.start_date <= NOW()
                         AND rp.end_date >= NOW()
LEFT JOIN coupon_relations cprp ON i.id = cprp.item_id AND cprp.rental_plan_id = rp.id
LEFT JOIN coupons crp ON crp.id = cprp.coupon_id
                     AND crp.start_date <= NOW()
                     AND crp.end_date >= NOW()
                     AND crp.type = 1
                     AND crp.distribution_type = 1
WHERE i.id = ${item_id}
ORDER BY c.discount_rate DESC, c.discount_price DESC, rp.plan_price DESC;$snip$),
  ($snip$pricing$snip$, $snip$item-discount-relation-insert$snip$, $snip$INSERT INTO item_discount_relations (item_discount_id, rental_item_id, discount_price)
VALUES ((SELECT id FROM item_discounts WHERE item_id = ${item_id} LIMIT 1),
        ${rental_item_id},
        1000);$snip$),
  ($snip$pricing$snip$, $snip$move-item-discount-away$snip$, $snip$UPDATE item_discount_by_rental_counts             SET item_id = ${new_item_id} WHERE item_id = ${item_id};
UPDATE item_discount_by_purchased_rental_items    SET item_id = ${new_item_id} WHERE item_id = ${item_id};$snip$),
  ($snip$pricing$snip$, $snip$rfid-discount-provision-alt$snip$, $snip$-- Alternate RFID discount provisioning: 32-char RFID, ecrobo status=1, delivery_status=11, 50% rate / no floor.
-- Idempotent: skip inserts when an ecrobo_items / ecrobo_delivered_items row already exists for the target rental.
INSERT INTO ecrobo_items (item_id, rfid, status)
SELECT ri.item_id,
       LPAD(CAST(COALESCE((SELECT CAST(ei.rfid AS UNSIGNED)
                           FROM ecrobo_items ei
                           WHERE ei.item_id = ri.item_id
                           ORDER BY ei.id DESC
                           LIMIT 1), 0) + 1 AS CHAR), 32, '0') AS new_rfid,
       1                                                       AS status
FROM rental_items ri
WHERE ri.id = ${rental_item_id}
  AND NOT EXISTS (SELECT 1 FROM ecrobo_items ei2 WHERE ei2.item_id = ri.item_id)
ORDER BY ri.id DESC
LIMIT 1;

INSERT INTO ecrobo_delivered_items (user_id, item_id, rental_item_id, user_shipping_id, count, delivery_status,
                                    delivery_tracking_code, ecrobo_item_id)
SELECT ri.user_id,
       ri.item_id,
       ri.id,
       ri.user_id,
       1,
       11,
       '123456789',
       (SELECT id FROM ecrobo_items WHERE item_id = ri.item_id ORDER BY id DESC LIMIT 0, 1)
FROM rental_items ri
WHERE ri.id = ${rental_item_id}
  AND NOT EXISTS (SELECT 1 FROM ecrobo_delivered_items edi WHERE edi.rental_item_id = ri.id);

INSERT INTO item_rfid_discounts (rfid, discount_rate, discount_price, start_date, end_date)
SELECT rfid, 50, 0, '2025-01-01', '2300-01-01'
FROM ecrobo_items ei
INNER JOIN ecrobo_delivered_items edi ON edi.ecrobo_item_id = ei.id
INNER JOIN rental_items ri ON ri.id = edi.rental_item_id
WHERE ri.id = ${rental_item_id}
LIMIT 1;$snip$),
  ($snip$pricing$snip$, $snip$rfid-discount-provision$snip$, $snip$-- Provision an ecrobo_item, link it to the rental, and attach a 50% RFID discount.
INSERT INTO ecrobo_items (item_id, rfid, status)
SELECT ri.item_id,
       LPAD(CAST(COALESCE((SELECT CAST(ei.rfid AS UNSIGNED)
                           FROM ecrobo_items ei
                           WHERE ei.item_id = ri.item_id
                           ORDER BY ei.id DESC
                           LIMIT 1), 1000) + 1 AS CHAR), 24, '0') AS new_rfid,
       2 AS status
FROM rental_items ri
WHERE ri.id = ${rental_item_id}
ORDER BY ri.id DESC
LIMIT 1;

INSERT INTO ecrobo_delivered_items (user_id, item_id, rental_item_id, user_shipping_id, count,
                                    delivery_status, delivery_tracking_code, ecrobo_item_id)
SELECT user_id,
       item_id,
       id,
       user_id,
       1,
       2,
       'sample-tracking-code',
       (SELECT id FROM ecrobo_items WHERE item_id = rental_items.item_id ORDER BY id DESC LIMIT 0, 1)
FROM rental_items
WHERE id = ${rental_item_id};

INSERT INTO item_rfid_discounts (rfid, discount_rate, discount_price, start_date, end_date)
SELECT rfid, 50, 1000, '2025-07-15', '2300-12-31'
FROM ecrobo_items ei
INNER JOIN ecrobo_delivered_items edi ON edi.ecrobo_item_id = ei.id
INNER JOIN rental_items ri ON ri.id = edi.rental_item_id
WHERE ri.id = ${rental_item_id}
LIMIT 1;$snip$),
  ($snip$pricing$snip$, $snip$toggle-discount-relation-status$snip$, $snip$UPDATE item_discount_relations
SET status = 2
WHERE rental_item_id = ${rental_item_id};$snip$),
  ($snip$pricing$snip$, $snip$view-buy-new-buy-reuse$snip$, $snip$SELECT id,
       original_price,
       rental_price,
       (buy_new + ROUND(t.buy_new * 10))     AS buy_new_w_vat,
       (buy_reuse + ROUND(t.buy_reuse * 10)) AS buy_reuse_w_vat
FROM (
    SELECT ri.id,
           iph.original_price,
           SUM(rit.price)                                                                              AS rental_price,
           iph.original_price - SUM(rit.price)                                                         AS buy_new,
           ROUND(iph.original_price - (iph.original_price - SUM(rit.price)) * iph.discount_rate / 100) AS buy_reuse
    FROM rental_items ri
    LEFT JOIN item_price_histories iph
        ON iph.item_id = ri.item_id AND iph.price_version = ri.price_version
    LEFT JOIN rental_item_transactions rit
        ON rit.rental_item_id = ri.id AND rit.status IN (1, 4) AND rit.month <= iph.month_limit
    WHERE ri.id = ${rental_item_id}
) AS t;$snip$),
  ($snip$purchase$snip$, $snip$reset-purchase$snip$, $snip$-- Strip the purchase rows for a rental but keep the rental itself alive.
DELETE pi, pit, t
FROM purchased_items pi
LEFT JOIN purchased_item_transactions pit ON pit.purchased_item_id = pi.id
LEFT JOIN transactions t ON t.id = pit.transaction_id
WHERE pi.rental_item_id = ${rental_item_id};

UPDATE rental_items
SET delivery_status = 2,
    stopped_at      = NULL
WHERE id = ${rental_item_id};$snip$),
  ($snip$purchase$snip$, $snip$view-latest-rit-per-purchased$snip$, $snip$SELECT rit.*
FROM `purchased_items`
INNER JOIN (
    SELECT rit1.*
    FROM rental_item_transactions rit1
    INNER JOIN (
        SELECT rental_item_id, MAX(id) AS id
        FROM rental_item_transactions
        GROUP BY rental_item_id
    ) rit2 ON rit1.id = rit2.id
) AS rit ON purchased_items.rental_item_id = rit.rental_item_id
WHERE rit.rental_item_id = ${rental_item_id};$snip$),
  ($snip$purchase$snip$, $snip$view-purchase-timeline$snip$, $snip$SELECT pi.id,
       pi.rental_item_id,
       pi.delivery_status,
       pi.cancel_flg,
       pi.created_at,
       ri.next_started_at,
       pit.traded_at AS pit_traded_at,
       rit.traded_at AS rit_traded_at
FROM purchased_items pi
INNER JOIN rental_items ri ON ri.id = pi.rental_item_id
INNER JOIN purchased_item_transactions pit ON pit.purchased_item_id = pi.id
INNER JOIN rental_item_transactions rit ON rit.rental_item_id = pi.rental_item_id
ORDER BY rit.traded_at DESC;$snip$),
  ($snip$recommendation$snip$, $snip$insert-item-shipping-fee$snip$, $snip$INSERT INTO item_shipping_fees (item_pack_size_id, transport_company_id, fee, start_date, end_date)
VALUES ((SELECT item_pack_size_id    FROM items WHERE id = ${item_id} LIMIT 1),
        (SELECT transport_company_id FROM items WHERE id = ${item_id} LIMIT 1),
        500,
        NULL,
        NULL);$snip$),
  ($snip$recommendation$snip$, $snip$move-categories-parent-id$snip$, $snip$UPDATE mall.categories
SET parent_id = 0
WHERE id IN (1,2,3);$snip$),
  ($snip$recommendation$snip$, $snip$personalised-recommendation$snip$, $snip$SELECT `ri`.`item_id`,
       ud.user_id,
       ud.birthday,
       ud.sex,
       COUNT(DISTINCT (ri.id)) AS count
FROM rental_items ri
JOIN items i ON i.id = ri.item_id
LEFT JOIN item_groups ig ON ig.item_id = i.id AND ig.type = '1'
LEFT JOIN items similar_i ON similar_i.id = ig.related_item_id
LEFT JOIN item_campaigns ic ON ic.item_id = i.id
LEFT JOIN user_details ud ON ud.user_id = ri.user_id
LEFT JOIN category_items ci ON ci.item_id = i.id
WHERE (i.count > 0
       OR similar_i.count > 0
       OR (ic.request_volume > 0
           AND ic.request_start_date <= DATE_FORMAT(NOW(), '%Y-%m-%d')
           AND ic.request_end_date  >= DATE_FORMAT(NOW(), '%Y-%m-%d')))
  AND i.status = 1
  AND ri.started_at > DATE_FORMAT(SUBDATE(NOW(), 90), '%Y-%m-%d')
  AND ud.user_id = ${user_id}
GROUP BY `ri`.`item_id`
ORDER BY count DESC;$snip$),
  ($snip$recommendation$snip$, $snip$questionnaire-answers-by-item$snip$, $snip$SELECT `QuestionnaireAnswer`.`answers`,
       `QuestionnaireAnswer`.`created_at`,
       `QuestionnaireAnswer`.`show_user_info`,
       `QuestionnaireAnswer`.`rental_item_id`,
       `QuestionnaireAnswer`.`item_id`,
       `QuestionnaireAnswer`.`purchased_item_id`,
       `UserDetail`.`nick_name`,
       `UserDetail`.`sex`,
       `UserDetail`.user_id,
       CAST(FORMAT(DATEDIFF(CURRENT_DATE, birthday) / 365, 2) AS UNSIGNED) AS `age`
FROM `questionnaire_answers` AS `QuestionnaireAnswer`
INNER JOIN `user_details` AS `UserDetail`
    ON `QuestionnaireAnswer`.`user_id` = `UserDetail`.`user_id`
WHERE `QuestionnaireAnswer`.`item_id` IN (1,2,3)
  AND `QuestionnaireAnswer`.`status` = 2
  AND `QuestionnaireAnswer`.`item_review` IN (5)
  AND `QuestionnaireAnswer`.`service_review` IN (5)
  AND (`QuestionnaireAnswer`.`purchased_item_id` IS NOT NULL
       OR `QuestionnaireAnswer`.`rental_item_id` IS NOT NULL);$snip$),
  ($snip$recommendation$snip$, $snip$shipping-fee-resolver$snip$, $snip$SELECT i.id            AS item_id,
       i.item_pack_size_id,
       i.transport_company_id,
       isf.id           AS item_shipping_fee_id,
       isf.fee          AS shipping_fee,
       isf.start_date,
       isf.end_date,
       isf.updated_at
FROM items i
LEFT JOIN item_shipping_fees isf
    ON isf.item_pack_size_id = i.item_pack_size_id
   AND isf.transport_company_id = i.transport_company_id
   AND (isf.start_date IS NULL OR isf.start_date <= CURDATE())
   AND (isf.end_date   IS NULL OR isf.end_date   >= CURDATE())
WHERE i.id = ${item_id}
ORDER BY isf.updated_at DESC
LIMIT 1;$snip$),
  ($snip$recommendation$snip$, $snip$special-sale-candidates$snip$, $snip$SELECT ri.item_id,
       COUNT(DISTINCT ri.id) AS rental_count,
       GREATEST(
           MAX(c.discount_rate),
           MAX(c.discount_price / i.rental_price * 100),
           COALESCE(MAX(cplan.discount_price / rp.plan_price * 100), 0),
           COALESCE(MAX(cplan.discount_rate), 0)
       ) AS discount_rate
FROM rental_items AS ri
JOIN items AS i ON i.id = ri.item_id
LEFT JOIN coupon_relations AS cr ON cr.item_id = ri.item_id AND cr.rental_plan_id IS NULL
LEFT JOIN coupons AS c
    ON c.id = cr.coupon_id
   AND c.distribution_type = 1 AND c.tv_flg = 0
   AND c.start_date <= NOW() AND c.end_date >= NOW()
LEFT JOIN rental_plan_items rpi ON rpi.item_id = i.id
LEFT JOIN rental_plans rp
    ON rp.id = rpi.rental_plan_id
   AND rp.start_date <= CURDATE() AND rp.end_date >= CURDATE()
LEFT JOIN coupon_relations AS crplan
    ON crplan.item_id = ri.item_id AND crplan.rental_plan_id = rp.id
LEFT JOIN coupons AS cplan
    ON cplan.id = crplan.coupon_id
   AND cplan.type = 1 AND cplan.distribution_type = 1
   AND cplan.tv_flg = 0
   AND cplan.start_date <= NOW() AND cplan.end_date >= NOW()
WHERE ri.cancel_flg = 0
  AND ri.started_at >= SUBDATE(NOW(), 90)
  AND ri.item_id NOT IN (SELECT item_id FROM shop_site_items)
  AND i.status = 1
GROUP BY ri.item_id
HAVING discount_rate > 30
ORDER BY discount_rate DESC, rental_count DESC, ri.item_id DESC
LIMIT 50;$snip$),
  ($snip$recommendation$snip$, $snip$top-categories-with-count$snip$, $snip$SELECT c.id, c.name_en, c.parent_id, COUNT(*) AS item_count
FROM categories c
LEFT JOIN category_items ci ON ci.category_id = c.id
GROUP BY c.id;$snip$),
  ($snip$recommendation$snip$, $snip$top-rented-last-90d$snip$, $snip$SELECT `item_id`, COUNT(`id`) AS `count`
FROM `rental_items` AS `RentalItem`
WHERE `RentalItem`.`cancel_flg` = 0
  AND `RentalItem`.`started_at` >= DATE_FORMAT(SUBDATE(NOW(), 90), '%Y-%m-%d')
GROUP BY `item_id`
ORDER BY COUNT(`id`) DESC, `RentalItem`.`item_id` DESC
LIMIT 50;$snip$),
  ($snip$recommendation$snip$, $snip$top-rented-per-category$snip$, $snip$SELECT `ri`.`item_id`,
       COUNT(DISTINCT (ri.item_id)) AS count
FROM rental_items ri
JOIN items i ON i.id = ri.item_id
LEFT JOIN item_groups ig ON ig.item_id = i.id AND ig.type = '1'
LEFT JOIN items similar_i ON similar_i.id = ig.related_item_id
LEFT JOIN item_campaigns ic ON ic.item_id = i.id
WHERE ((i.count > 0 OR similar_i.count > 0
        OR (ic.available_volume > 0
            AND ic.request_start_date <= '2025-01-01'
            AND ic.request_end_date   >= '2025-01-01')))
  AND i.status = 1
  AND i.recommend_display = 1
  AND ri.started_at > '2025-01-01'
GROUP BY `ri`.`id`
ORDER BY count DESC;$snip$),
  ($snip$rental$snip$, $snip$add-amz-failed-transactions$snip$, $snip$UPDATE users
SET default_payment_method = 2
WHERE id = ${user_id};

INSERT INTO rental_items (user_id, item_id, price_version, user_shipping_id, count,
                          started_at, next_started_at,
                          delivery_status, cancel_flg, rental_type, store_id)
VALUES (${user_id}, 546, 1, 112, 1, NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), 2, 0, 1, 1);

INSERT INTO transactions (user_id, price, tax_price, tax, traded_at, type)
VALUES (${user_id}, 3000, 300, 10, '2025-04-01', 1);

INSERT INTO rental_item_transactions (user_id, price, original_price, tax, rental_item_id,
                                      status, type, month, traded_at, transaction_id)
VALUES (${user_id}, 3000, 10000, 10,
        (SELECT id FROM rental_items ORDER BY id DESC LIMIT 1),
        4, 2, 1, NOW(),
        (SELECT id FROM transactions ORDER BY id DESC LIMIT 1));

INSERT INTO transactions (user_id, price, tax_price, tax, traded_at, type)
VALUES (${user_id}, 3000, 300, 10, '2025-04-01', 1);

INSERT INTO rental_item_transactions (user_id, price, original_price, tax, rental_item_id,
                                      status, type, month, traded_at, transaction_id)
VALUES (${user_id}, 3000, 10000, 10,
        (SELECT id FROM rental_items ORDER BY id DESC LIMIT 1),
        8, 2, 2, NOW(),
        (SELECT id FROM transactions ORDER BY id DESC LIMIT 1));$snip$),
  ($snip$rental$snip$, $snip$back-start-at$snip$, $snip$UPDATE rental_items
SET started_at      = SUBDATE(NOW(), INTERVAL ${months_back} MONTH),
    next_started_at = CURRENT_DATE,
    delivery_status = 2,
    stopped_at      = NULL
WHERE id = ${rental_item_id};$snip$),
  ($snip$rental$snip$, $snip$cancel-all-rentals$snip$, $snip$UPDATE rental_items
SET cancel_flg = 1,
    stopped_at = NOW()
WHERE user_id = ${user_id};$snip$),
  ($snip$rental$snip$, $snip$disable-rental-plan-penalty$snip$, $snip$UPDATE rental_items
SET disable_rental_plan_penalty = 1
WHERE id = ${rental_item_id};$snip$),
  ($snip$rental$snip$, $snip$reset-rental$snip$, $snip$UPDATE rental_items
SET expected_stopped_at = NULL,
    started_at          = NULL,
    next_started_at     = NULL,
    delivery_status     = 2
WHERE id = ${rental_item_id};$snip$),
  ($snip$rental$snip$, $snip$run-penalty-batch$snip$, $snip$-- Backdate the rental + flip statuses so the penalty batch picks it up on the next tick.
UPDATE rental_items AS r
LEFT JOIN rental_penalty_transactions AS rpt ON rpt.rental_item_id = r.id
LEFT JOIN ecrobo_returned_items AS eri ON eri.rental_item_id = r.id
SET r.started_at          = NOW() - INTERVAL 30 DAY,
    r.delivery_status     = 2,
    r.expected_stopped_at = NOW(),
    r.next_started_at     = NOW() - INTERVAL 90 DAY,
    r.rental_plan_id      = 1,
    rpt.status            = 2,
    eri.return_status     = 1
WHERE r.id = ${rental_item_id};$snip$),
  ($snip$rental$snip$, $snip$update-rit-status$snip$, $snip$UPDATE rental_item_transactions rit
LEFT JOIN transactions rittx ON rittx.id = rit.transaction_id
SET rit.status      = ${rental_item_transaction_status},
    rittx.cancel_flg = 0,
    rittx.traded_at = NOW(),
    rit.created_at  = NOW()
WHERE rit.id = 1;$snip$),
  ($snip$rental_plan$snip$, $snip$delete-rental-plan-items$snip$, $snip$DELETE FROM rental_plan_items
WHERE item_id = ${item_id}
  AND rental_plan_id = 1;$snip$),
  ($snip$rental_plan$snip$, $snip$insert-rental-plan-items$snip$, $snip$INSERT INTO rental_plan_items (item_id, rental_plan_id)
VALUES (${item_id}, 1);$snip$),
  ($snip$rental_plan$snip$, $snip$insert-rental-plan$snip$, $snip$INSERT INTO mall.rental_plans (id, plan_price, plan_duration_month, start_date, end_date)
VALUES ((SELECT max_id + 1 FROM (SELECT MAX(id) AS max_id FROM rental_plans) AS m),
        4100, 3, '2025-07-15', '2300-12-31');$snip$),
  ($snip$rental_plan$snip$, $snip$view-rental-plans-by-item$snip$, $snip$SELECT rp.id,
       rp.plan_duration_month,
       rp.plan_price,
       rpi.item_id,
       rp.start_date,
       rp.end_date
FROM rental_plans rp
LEFT JOIN rental_plan_items rpi ON rpi.rental_plan_id = rp.id
WHERE rpi.item_id = ${item_id};$snip$),
  ($snip$return$snip$, $snip$exit-return$snip$, $snip$UPDATE rental_items
SET expected_stopped_at = NULL,
    started_at          = NULL,
    next_started_at     = NULL,
    delivery_status     = 2
WHERE id = ${rental_item_id};$snip$),
  ($snip$return$snip$, $snip$fake-ship-method$snip$, $snip$UPDATE mall.ecrobo_returned_items t
SET t.denpyo_no  = 'denpyo-12345',
    t.trading_id = 'trade-12345',
    t.reserve_no = 'reserve-12345'
WHERE t.rental_item_id = ${rental_item_id};$snip$),
  ($snip$return$snip$, $snip$finish-return$snip$, $snip$UPDATE `ecrobo_returned_items` AS cri
LEFT JOIN rental_items AS ri ON cri.rental_item_id = ri.id
LEFT JOIN ecrobo_delivered_items AS edi ON edi.rental_item_id = ri.id
SET cri.`reserve_no`     = NULL,
    cri.`reserve_pwd`    = 'pwd-12345',
    cri.`trading_id`     = 'trade-12345',
    cri.`return_flg`     = 1,
    cri.`expired_at`     = ADDDATE(ri.next_started_at, 7),
    cri.`denpyo_no`      = 'denpyo-12345',
    ri.`expected_stopped_at` = ADDDATE(ri.next_started_at, 14),
    ri.`stopped_at`      = NOW(),
    ri.`delivery_status` = 2,
    edi.`change_date`    = NOW()
WHERE ri.`id` = ${rental_item_id};$snip$),
  ($snip$return$snip$, $snip$insert-ecrobo-delivered-items$snip$, $snip$INSERT INTO ecrobo_delivered_items (user_id, user_shipping_id, item_id, rental_item_id, change_date, count)
SELECT user_id, user_shipping_id, item_id, id, '2025-01-01', 1
FROM rental_items
WHERE id = ${rental_item_id};$snip$),
  ($snip$return$snip$, $snip$inspect-rental-return-state$snip$, $snip$SELECT eri.id,
       ri.id   AS rental_item_id,
       ri.user_id,
       eri.return_status,
       pi.id   AS purchased_item_id,
       pi.cancel_flg,
       edi.id  AS ecrobo_delivered_id,
       edi.change_date,
       rpt.status               AS penalty_status,
       rpt.early_termination_fee,
       ri.started_at,
       ri.next_started_at,
       rp.plan_duration_month
FROM rental_items ri
LEFT JOIN `ecrobo_returned_items` eri ON eri.rental_item_id = ri.id
LEFT JOIN purchased_items pi ON pi.rental_item_id = ri.id
LEFT JOIN ecrobo_delivered_items edi ON edi.rental_item_id = ri.id
LEFT JOIN rental_penalty_transactions rpt ON rpt.rental_item_id = ri.id
LEFT JOIN rental_plans rp ON rp.id = ri.rental_plan_id
WHERE ri.id IN (1,2,3)
GROUP BY ri.id
ORDER BY ri.id DESC;$snip$),
  ($snip$store$snip$, $snip$insert-store-cart-items$snip$, $snip$INSERT INTO mall.store_carts (user_id, item_id, count, store_id) VALUES (${user_id}, ${item_id_1}, 1, 1);
INSERT INTO mall.store_carts (user_id, item_id, count, store_id) VALUES (${user_id}, ${item_id_2}, 1, 1);
INSERT INTO mall.store_carts (user_id, item_id, count, store_id) VALUES (${user_id}, ${item_id_3}, 1, 1);$snip$),
  ($snip$store$snip$, $snip$provision-store-item-price-histories$snip$, $snip$INSERT INTO store_item_price_histories
    (store_id, item_id, price_version, tag_id,
     rental_price, original_price, month_limit, discount_rate, discount_price)
SELECT si.store_id,
       si.item_id,
       si.price_version,
       1  AS tag_id,
       si.rental_price,
       si.original_price,
       12  AS month_limit,
       50 AS discount_rate,
       1000  AS discount_price
FROM store_items si
WHERE si.store_id = 1
  AND si.item_id IN (${item_id_1}, ${item_id_2}, ${item_id_3})
  AND NOT EXISTS (
      SELECT 1 FROM store_item_price_histories h
      WHERE h.store_id      = si.store_id
        AND h.item_id       = si.item_id
        AND h.price_version = si.price_version
  );$snip$),
  ($snip$store$snip$, $snip$provision-store-items$snip$, $snip$INSERT INTO store_items
    (store_id, item_id, store_item_is_active, price_version,
     store_item_barcode, rental_price, original_price)
SELECT 1                  AS store_id,
       i.id               AS item_id,
       1                  AS store_item_is_active,
       i.price_version,
       CAST(i.id AS CHAR) AS store_item_barcode,
       i.rental_price,
       i.original_price
FROM items i
WHERE i.id IN (${item_id_1}, ${item_id_2}, ${item_id_3})
  AND NOT EXISTS (
      SELECT 1 FROM store_items si
      WHERE si.store_id = 1 AND si.item_id = i.id
  );$snip$),
  ($snip$store$snip$, $snip$reset-store-cart-for-user$snip$, $snip$DELETE FROM mall.store_carts WHERE user_id = ${user_id};$snip$),
  ($snip$user$snip$, $snip$bulk-update-birthday$snip$, $snip$-- Bulk-seed an age cohort across user_details. Adjust the YEAR offset as needed.
UPDATE user_details
SET birthday = SUBDATE(NOW(), INTERVAL 18 YEAR)
WHERE user_id > ${user_id};$snip$),
  ($snip$user$snip$, $snip$find-airtouch-pending$snip$, $snip$-- Users with an airtouch rental in delivery_status=4 and not yet started.
SELECT u.id, u.email, r.cancel_flg, r.id AS rental_item_id
FROM users AS u
LEFT JOIN rental_items AS r ON r.user_id = u.id
LEFT JOIN items AS i ON i.id = r.item_id
WHERE r.delivery_status = 2
  AND r.cancel_flg = 0
  AND i.airtouch = 1
  AND r.started_at IS NULL
GROUP BY u.id, r.id
ORDER BY r.id DESC;$snip$),
  ($snip$user$snip$, $snip$find-by-amazon-sns$snip$, $snip$-- Look up users that have linked an Amazon Pay SNS account.
SELECT u.id,
       u.email,
       d.id AS user_detail_id,
       d.first_name,
       d.tel,
       d.post_code,
       d.city,
       u.created_at  AS u_created,
       us.created_at AS us_created
FROM users AS u
LEFT JOIN user_details AS d ON d.user_id = u.id
LEFT JOIN user_sns AS us ON us.user_id = u.id
WHERE us.sns_id = 'amzn-sample-sns-id'
ORDER BY u.id DESC
LIMIT 0, 50;$snip$),
  ($snip$user$snip$, $snip$find-by-payment-method$snip$, $snip$-- Users whose default_payment_method=2 with incomplete details (tel / post_code missing).
SELECT u.id,
       u.email,
       d.first_name,
       d.tel,
       d.post_code,
       d.city,
       u.created_at  AS u_created,
       us.created_at AS us_created
FROM users AS u
LEFT JOIN user_details AS d ON d.user_id = u.id
LEFT JOIN user_sns AS us ON us.user_id = u.id
WHERE u.default_payment_method = 2
  AND (d.tel = '' OR d.tel IS NULL OR d.post_code = '' OR d.post_code IS NULL)
ORDER BY u.id DESC
LIMIT 0, 50;$snip$),
  ($snip$user$snip$, $snip$list-users-with-rental-count$snip$, $snip$-- Per-user counts of rentals and matching item_discount_by_rental_counts rows.
SELECT u.id,
       u.email,
       r.cancel_flg,
       r.id              AS rental_item_id,
       COUNT(d.id)       AS count_rental_count,
       COUNT(t.id)       AS rental_count
FROM users AS u
LEFT JOIN rental_items AS r ON r.user_id = u.id
LEFT JOIN items AS i ON i.id = r.item_id
LEFT JOIN item_discount_by_rental_counts AS d ON d.item_id = r.item_id
LEFT JOIN rental_item_transactions AS t ON t.rental_item_id = r.id
WHERE r.delivery_status = 2
  AND r.cancel_flg = 0
  AND r.started_at IS NOT NULL
GROUP BY u.id, r.id
ORDER BY r.id DESC;$snip$),
  ($snip$user$snip$, $snip$reset-transactions$snip$, $snip$-- Reset all transaction-related state for a user. Form fields:
--   user_id -> target users.id
-- Deletes junction rows first (FK children of transactions), then the
-- transactions themselves, then the rental_items / purchase_items that
-- the junction tables used to reference. Junction tables don't carry
-- user_id directly, so they're scoped via JOIN on transactions.user_id.
DELETE rit
FROM rental_item_transactions rit
JOIN transactions t ON t.id = rit.transaction_id
WHERE t.user_id = ${user_id};

DELETE pit
FROM purchased_item_transactions pit
JOIN transactions t ON t.id = pit.transaction_id
WHERE t.user_id = ${user_id};

DELETE rpt
FROM rental_penalty_transactions rpt
JOIN transactions t ON t.id = rpt.transaction_id
WHERE t.user_id = ${user_id};

DELETE FROM transactions WHERE user_id = ${user_id};
DELETE FROM rental_items WHERE user_id = ${user_id};
DELETE FROM purchased_items WHERE user_id = ${user_id};$snip$),
  ($snip$user$snip$, $snip$reset-user-address$snip$, $snip$-- Marks a target user_details / user_shippings row as the canonical test address.
UPDATE user_details
SET tel              = '08012345678',
    post_code        = '1500001',
    verified_account = 'verified',
    last_name        = 'TestLast'
WHERE tel = '08012345678'
   OR post_code = '1500001'
   OR verified_account = 'verified'
   OR verified_account = 'verified'
   OR (`last_name` = 'TestLast' AND `first_name` = 'TestFirst' AND `birthday` = '1990-01-01');

UPDATE user_shippings
SET tel              = '08012345678',
    post_code        = '1500001',
    verified_account = 'verified',
    last_name        = 'TestLast'
WHERE tel = '08012345678'
   OR post_code = '1500001'
   OR verified_account = 'verified'
   OR verified_account = 'verified'
   OR (`last_name` = 'TestLast' AND `first_name` = 'TestFirst');$snip$),
  ($snip$user$snip$, $snip$update-default-payment-method$snip$, $snip$UPDATE users
SET default_payment_method = ${default_payment_method}
WHERE id = ${user_id};$snip$),
  ($snip$user$snip$, $snip$update-sns-id$snip$, $snip$-- Rewrite user_sns.sns_id for the first user whose default_payment_method=2.
UPDATE user_sns
SET sns_id = '${sns_id}'
WHERE user_id = ${user_id};$snip$)
on conflict (tab, title) do nothing;
