# Fumi-Mate Timer Implementation (45min Auto-Submit)
Status: 🚀 In Progress

## Breakdown Steps (Approved Plan)

### Phase 1: Frontend Timer UI ✅ Complete
- [x] 1.1 Add states: hasStarted, timeLeft (2700s), timerActive, startTime
- [x] 1.2 Add "Bắt đầu" button (prominent, disabled if started)
- [x] 1.3 Implement useEffect countdown setInterval(1s), update timeLeft
- [x] 1.4 Add large timer display (MM:SS, red <5min)
- [x] 1.5 Auto-submit when timeLeft <=0 via handleSubmit()
- [x] 1.6 Persist startTime localStorage
- [x] 1.7 Test: manual start → countdown → auto-submit
- [ ] 1.5 Auto-submit when timeLeft <=0 via handleSubmit()
- [ ] 1.6 Persist startTime localStorage
- [ ] 1.7 Test: manual start → countdown → auto-submit

### Phase 2: Backend start_time Tracking
- [ ] 2.1 Edit submission.py: add start_time DateTime field
- [ ] 2.2 Edit student.py: save start_time on submit if null
- [ ] 2.3 Create Alembic migration: add_column start_time
- [ ] 2.4 Run `flask db migrate` + `flask db upgrade`

### Phase 3: Integration & Polish
- [ ] 3.1 Frontend: send start_time to backend on submit/save
- [ ] 3.2 Backend: calculate time_used = updated_at - start_time
- [ ] 3.3 UI: show "Time used" post-submit
- [ ] 3.4 Tasks page: show timer status
- [ ] 3.5 Full E2E test: start→write→auto-submit@45m

### Phase 4: Deployment/Verify
- [ ] Restart API (`python fumi-mate-api/run.py`)
- [ ] Test in browser with seeded tasks
- [ ] ✅ Complete: attempt_completion

**Current Step:** 1.1-1.7 Frontend implementation
**ETA:** 30min per phase
