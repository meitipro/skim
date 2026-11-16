# Mutations

Written by `python scripts/mutate.py --table docs/MUTATIONS.md`. 86 defences in
`contracts/skim.py` were each broken on their own, and every mutant was caught. Each row
names the first test that failed against it, read from pytest's report rather than an exit code.
The generated-copy and deployed-record tests are excluded, because they fail for any edit at all.

| # | defence broken | caught by |
|---|---|---|
| 1 | open_card: a 79 word window | `tests/test_direct.py::test_the_limits_of_a_card` |
| 2 | open_card: a 201 word window | `tests/test_direct.py::test_the_limits_of_a_card` |
| 3 | open_card: two questions are enough | `tests/test_direct.py::test_the_limits_of_a_card` |
| 4 | open_card: six questions | `tests/test_direct.py::test_the_limits_of_a_card` |
| 5 | open_card: a 121 character question | `tests/test_direct.py::test_the_limits_of_a_card` |
| 6 | open_card: an 81 character name | `tests/test_direct.py::test_the_limits_of_a_card` |
| 7 | open_card: a fee above 10 GEN | `tests/test_direct.py::test_the_limits_of_a_card` |
| 8 | open_card: a negative fee | `tests/test_direct.py::test_the_limits_of_a_card` |
| 9 | open_card: the owner is nobody | `tests/test_direct.py::test_open_card_stores_the_questions_window_and_fee` |
| 10 | update_card: anyone may update | `tests/test_direct.py::test_only_the_owner_updates_a_card` |
| 11 | update_card: the window is not checked | `tests/test_direct.py::test_only_the_owner_updates_a_card` |
| 12 | update_card: the questions are not checked | `tests/test_direct.py::test_only_the_owner_updates_a_card` |
| 13 | questions: a multi-line question | `tests/test_direct.py::test_the_limits_of_a_card` |
| 14 | submit: any fee | `tests/test_direct.py::test_the_fee_is_exact` |
| 15 | submit: a fee that is too small | `tests/test_direct.py::test_the_fee_is_exact` |
| 16 | submit: a fee that is too large | `tests/test_direct.py::test_the_fee_is_exact` |
| 17 | submit: the fee is not held | `tests/test_direct.py::test_submit_pays_the_fee_and_cuts_the_first_attempt_under_the_card_s_rules` |
| 18 | submit: the fee is not counted as received | `tests/test_direct.py::test_submit_pays_the_fee_and_cuts_the_first_attempt_under_the_card_s_rules` |
| 19 | submit: the fee is not added to the held total | `tests/test_direct.py::test_submit_pays_the_fee_and_cuts_the_first_attempt_under_the_card_s_rules` |
| 20 | submit: the author is nobody | `tests/test_direct.py::test_submit_pays_the_fee_and_cuts_the_first_attempt_under_the_card_s_rules` |
| 21 | submit: a 101 character title | `tests/test_direct.py::test_the_limits_of_a_proposal` |
| 22 | submit: a 6001 character text | `tests/test_direct.py::test_the_limits_of_a_proposal` |
| 23 | submit: the cooldown is ignored | `tests/test_direct.py::test_after_a_shelved_proposal_the_author_waits_seven_days_on_that_card_only` |
| 24 | submit: the cooldown is one day | `tests/test_direct.py::test_three_failed_attempts_shelve_the_proposal_and_the_fees_go_to_the_card_s_owner` |
| 25 | submit: the cooldown ends a second early | `tests/test_direct.py::test_after_a_shelved_proposal_the_author_waits_seven_days_on_that_card_only` |
| 26 | submit: the cooldown is for every card | `tests/test_direct.py::test_after_a_shelved_proposal_the_author_waits_seven_days_on_that_card_only` |
| 27 | revise: anyone may revise | `tests/test_direct.py::test_revise_rules` |
| 28 | revise: any state | `tests/test_direct.py::test_revise_rules` |
| 29 | revise: four attempts | `tests/test_direct.py::test_missing_questions_are_counted_and_the_attempt_is_sent_back` |
| 30 | revise: the same text again | `tests/test_direct.py::test_revise_rules` |
| 31 | revise: the fee is not held again | `tests/test_direct.py::test_three_failed_attempts_shelve_the_proposal_and_the_fees_go_to_the_card_s_owner` |
| 32 | revise: no fee is taken | `tests/test_direct.py::test_three_failed_attempts_shelve_the_proposal_and_the_fees_go_to_the_card_s_owner` |
| 33 | attempt: the questions are not copied | `tests/test_direct.py::test_submit_pays_the_fee_and_cuts_the_first_attempt_under_the_card_s_rules` |
| 34 | attempt: the window is not copied | `tests/test_direct.py::test_the_judge_reads_only_the_window_and_never_what_comes_after` |
| 35 | attempt: the state does not go back to submitted | `tests/test_direct.py::test_three_failed_attempts_shelve_the_proposal_and_the_fees_go_to_the_card_s_owner` |
| 36 | cut: the title is not part of the window | `tests/test_direct.py::test_the_window_is_the_first_n_words_of_the_title_and_the_text` |
| 37 | cut: one word too many | `tests/test_direct.py::test_the_window_is_the_first_n_words_of_the_title_and_the_text` |
| 38 | cut: one word too few | `tests/test_direct.py::test_the_window_is_the_first_n_words_of_the_title_and_the_text` |
| 39 | cut: the whole text is read | `tests/test_direct.py::test_the_window_is_the_first_n_words_of_the_title_and_the_text` |
| 40 | cut: split on single spaces only | `tests/test_direct.py::test_the_window_is_the_first_n_words_of_the_title_and_the_text` |
| 41 | judge: the window is cut at the card's current size | `tests/test_static.py::test_the_window_is_cut_in_code_and_the_judge_gets_nothing_after_it` |
| 42 | judge: the card's current questions are used | `tests/test_direct.py::test_a_revised_attempt_is_cut_under_the_card_s_current_rules_and_an_open_attempt_keeps_its_own` |
| 43 | judge: read twice | `tests/test_direct.py::test_a_judged_attempt_is_not_read_twice_and_an_unknown_proposal_is_refused` |
| 44 | judge: validators agree with anything | `tests/test_direct.py::test_validators_compare_the_labels_and_nothing_else` |
| 45 | judge: an unreadable label defaults to FOUND | `tests/test_direct.py::test_read_answer_refuses_anything_but_one_label_per_question[{"labels":` |
| 46 | judge: the label count is not checked | `tests/test_direct.py::test_read_answer_refuses_anything_but_one_label_per_question[{"labels":` |
| 47 | judge: no retry on a slip | `tests/test_direct.py::test_a_formatting_slip_is_retried_once_and_two_slips_settle_nothing` |
| 48 | verdict: any missing still opens | `tests/test_direct.py::test_the_verdict_is_computed_in_code_from_the_missing_count_and_the_attempt` |
| 49 | verdict: the third failure is a rewrite | `tests/test_direct.py::test_the_verdict_is_computed_in_code_from_the_missing_count_and_the_attempt` |
| 50 | verdict: the second failure is shelved | `tests/test_direct.py::test_the_verdict_is_computed_in_code_from_the_missing_count_and_the_attempt` |
| 51 | settle: SKIMMABLE returns no fee | `tests/test_direct.py::test_all_found_is_skimmable_and_the_fee_goes_back` |
| 52 | settle: SKIMMABLE pays the owner | `tests/test_direct.py::test_all_found_is_skimmable_and_the_fee_goes_back` |
| 53 | settle: SKIMMABLE is not counted | `tests/test_direct.py::test_all_found_is_skimmable_and_the_fee_goes_back` |
| 54 | settle: SHELVED returns the fee to the author | `tests/test_direct.py::test_three_failed_attempts_shelve_the_proposal_and_the_fees_go_to_the_card_s_owner` |
| 55 | settle: SHELVED pays nobody | `tests/test_direct.py::test_three_failed_attempts_shelve_the_proposal_and_the_fees_go_to_the_card_s_owner` |
| 56 | settle: SHELVED sets no cooldown | `tests/test_direct.py::test_three_failed_attempts_shelve_the_proposal_and_the_fees_go_to_the_card_s_owner` |
| 57 | settle: SHELVED does not release the held fees | `tests/test_direct.py::test_three_failed_attempts_shelve_the_proposal_and_the_fees_go_to_the_card_s_owner` |
| 58 | settle: the pool is not raised | `tests/test_direct.py::test_three_failed_attempts_shelve_the_proposal_and_the_fees_go_to_the_card_s_owner` |
| 59 | settle: REWRITE releases the fee | `tests/test_direct.py::test_missing_questions_are_counted_and_the_attempt_is_sent_back` |
| 60 | settle: the labels are not stored | `tests/test_direct.py::test_all_found_is_skimmable_and_the_fee_goes_back` |
| 61 | settle: the missing count is not stored | `tests/test_direct.py::test_missing_questions_are_counted_and_the_attempt_is_sent_back` |
| 62 | settle: the verdict is not stored | `tests/test_direct.py::test_all_found_is_skimmable_and_the_fee_goes_back` |
| 63 | settle: the proposal state does not follow | `tests/test_direct.py::test_all_found_is_skimmable_and_the_fee_goes_back` |
| 64 | settle: the caller is not recorded | `tests/test_direct.py::test_all_found_is_skimmable_and_the_fee_goes_back` |
| 65 | waive: anyone may waive | `tests/test_direct.py::test_waive_rules` |
| 66 | waive: a proposal that opened | `tests/test_direct.py::test_waive_rules` |
| 67 | waive: a rewrite is not waivable | `tests/test_direct.py::test_money_leaves_the_contract_only_in_withdraw` |
| 68 | waive: a proposal waiting to be read is not waivable | `tests/test_direct.py::test_the_owner_waives_a_proposal_that_failed_the_skim_and_the_fees_go_back` |
| 69 | waive: the fees do not go back | `tests/test_direct.py::test_the_owner_waives_a_proposal_that_failed_the_skim_and_the_fees_go_back` |
| 70 | waive: the fees go to the owner | `tests/test_direct.py::test_the_owner_waives_a_proposal_that_failed_the_skim_and_the_fees_go_back` |
| 71 | waive: the proposal is not marked | `tests/test_direct.py::test_the_owner_waives_a_proposal_that_failed_the_skim_and_the_fees_go_back` |
| 72 | waive: the waiver is not recorded | `tests/test_direct.py::test_the_owner_waives_a_proposal_that_failed_the_skim_and_the_fees_go_back` |
| 73 | waive: the waiver is not counted | `tests/test_direct.py::test_the_owner_waives_a_proposal_that_failed_the_skim_and_the_fees_go_back` |
| 74 | withdraw: the balance is not cleared | `tests/test_direct.py::test_all_found_is_skimmable_and_the_fee_goes_back` |
| 75 | withdraw: a zero balance sends | `tests/test_direct.py::test_withdraw_is_a_top_level_transfer_of_the_whole_balance_to_the_caller` |
| 76 | withdraw: pays a fixed address | `tests/test_direct.py::test_all_found_is_skimmable_and_the_fee_goes_back` |
| 77 | withdraw: the owed total is not lowered | `tests/test_direct.py::test_all_found_is_skimmable_and_the_fee_goes_back` |
| 78 | withdraw: the paid total is not raised | `tests/test_direct.py::test_all_found_is_skimmable_and_the_fee_goes_back` |
| 79 | credit: the owed total is not raised | `tests/test_direct.py::test_all_found_is_skimmable_and_the_fee_goes_back` |
| 80 | release: the held total is not lowered | `tests/test_direct.py::test_all_found_is_skimmable_and_the_fee_goes_back` |
| 81 | prompt: the fence lets delimiters through | `tests/test_direct.py::test_the_prompt_carries_the_questions_and_fences_every_text` |
| 82 | prompt: the window is unfenced | `tests/test_direct.py::test_the_prompt_carries_the_questions_and_fences_every_text` |
| 83 | prompt: a question is unfenced | `tests/test_direct.py::test_the_prompt_carries_the_questions_and_fences_every_text` |
| 84 | prompt: the window size is wrong | `tests/test_direct.py::test_the_judge_reads_only_the_window_and_never_what_comes_after` |
| 85 | view: the listing ignores the card | `tests/test_direct.py::test_the_listing_is_newest_first_filtered_by_card_and_paged` |
| 86 | view: the listing ignores the offset | `tests/test_direct.py::test_the_listing_is_newest_first_filtered_by_card_and_paged` |
