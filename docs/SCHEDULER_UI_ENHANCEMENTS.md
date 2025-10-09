# Scheduler UI Enhancements

## Overview

The scheduler admin UI has been enhanced with operational controls that allow administrators to manage job execution without code changes. These enhancements follow the **hybrid approach** philosophy: developers define jobs in code, admins control execution through the UI.

## New Features

### 1. Cron Expression Editor

**Purpose:** Allow admins to adjust job schedules without redeployment.

**Features:**
- ✅ **Inline edit button** next to each job's cron expression
- ✅ **Modal editor** with live validation
- ✅ **Visual preview** showing human-readable description
- ✅ **Format guide** with common cron pattern examples
- ✅ **Error handling** with clear error messages
- ✅ **Confirmation** before saving changes

**UI Flow:**
```
Job Card → Click Edit Icon → Modal Opens
  → Edit Cron Expression → Live Preview Updates
  → Click Save → Validation → Update Backend
  → Success → Reload Jobs → Modal Closes
```

**Example:**
```
Before: 0 9 * * MON (Every Monday at 9:00 AM)
After:  0 10 * * TUE (Every Tuesday at 10:00 AM)
Preview: "Every Tuesday at 10:00 AM"
```

### 2. Visual Job Status

**Purpose:** Make job state immediately visible and intuitive.

**Features:**
- ✅ **Disabled badge** on inactive jobs
- ✅ **Opacity reduction** for disabled jobs (60% opacity)
- ✅ **Next run time** prominently displayed
- ✅ **Human-readable schedule** description
- ✅ **Last run status** with color-coded badges
- ✅ **Success rate** percentage

**Visual Indicators:**
- 🟢 **Enabled + Success**: Normal appearance, green success badge
- 🟡 **Enabled + Running**: Normal appearance, yellow running badge
- 🔴 **Enabled + Failed**: Normal appearance, red failed badge
- ⚪ **Disabled**: Faded (60% opacity), gray "Disabled" badge

### 3. Confirmation Dialogs

**Purpose:** Prevent accidental actions with critical consequences.

**Features:**
- ✅ **Enable/Disable toggle** requires confirmation
- ✅ **Clear action description** in dialog
- ✅ **Cancel option** to abort action
- ✅ **Confirm button** to proceed

**Confirmation Triggers:**
- Enabling a job (starts scheduled execution)
- Disabling a job (stops scheduled execution)

**Dialog Text:**
```
Title: Confirm Action
Body: Are you sure you want to disable Weekly Trending Digest?
Actions: [Cancel] [Confirm]
```

### 4. Improved Visual Feedback

**Purpose:** Provide clear feedback for all user actions.

**Features:**
- ✅ **Loading spinners** during async operations
- ✅ **Success messages** after actions complete
- ✅ **Error messages** with actionable information
- ✅ **Hover tooltips** on enable/disable toggle
- ✅ **Active selection** ring on selected job card

**States:**
- **Idle**: Normal appearance, all buttons enabled
- **Loading**: Spinner + disabled buttons
- **Success**: Brief confirmation, then refresh data
- **Error**: Error message with retry option

## UI Components

### Job Card (Enhanced)

**Layout:**
```
┌─────────────────────────────────────────┐
│ Title                    [Disabled] [✓] │ ← Badge + Toggle
│ Description text                        │
│                                         │
│ 🕐 0 9 * * MON               [Edit]   │ ← Cron + Edit button
│    "Every Monday at 9:00 AM"          │ ← Human-readable
│ 📅 Next: Mon Jan 13 2025, 9:00 AM    │ ← Next run
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ Total Runs: 42                   │   │ ← Stats
│ │ Success Rate: 95%                │   │
│ └─────────────────────────────────┘   │
│                                         │
│ Last Run: Completed                    │ ← Status
│ Mon Jan 6 2025, 9:15 AM               │
│ Duration: 2m 34s                       │
│                                         │
│ [▶ Trigger Now]                        │ ← Manual trigger
└─────────────────────────────────────────┘
```

**Interactions:**
- Click card → Show execution history
- Toggle switch → Confirm, then enable/disable
- Edit button → Open cron editor modal
- Trigger button → Execute job immediately

### Cron Editor Modal

**Layout:**
```
┌─────────────────────────────────────────┐
│ Edit Schedule                      [×]  │
├─────────────────────────────────────────┤
│                                         │
│ Cron Expression                         │
│ ┌─────────────────────────────────┐   │
│ │ 0 9 * * MON                     │   │ ← Input field
│ └─────────────────────────────────┘   │
│                                         │
│ Preview:                                │
│ ┌─────────────────────────────────┐   │
│ │ Every Monday at 9:00 AM         │   │ ← Live preview
│ └─────────────────────────────────┘   │
│                                         │
│ ℹ️ Cron Format Guide                   │
│ * * * * * = minute hour day month dow  │
│                                         │
│ Examples:                               │
│ 0 9 * * *     = Daily at 9:00 AM      │
│ 0 9 * * MON   = Every Monday at 9am   │
│ */30 * * * *  = Every 30 minutes      │
│ 0 */6 * * *   = Every 6 hours         │
│                                         │
│              [Cancel] [💾 Save]        │
└─────────────────────────────────────────┘
```

**Validation:**
- **Client-side**: Basic format check (5-6 parts)
- **Server-side**: Full cron syntax validation
- **Error display**: Red border + error message below input
- **Success**: Modal closes, job card updates

### Confirmation Dialog

**Layout:**
```
┌─────────────────────────────────────────┐
│ Confirm Action                          │
├─────────────────────────────────────────┤
│                                         │
│ Are you sure you want to:              │
│                                         │
│   disable Weekly Trending Digest?      │
│                                         │
│                                         │
│              [Cancel] [Confirm]        │
└─────────────────────────────────────────┘
```

**Behavior:**
- **Cancel**: Close dialog, no changes
- **Confirm**: Execute action, show loading, refresh data
- **Click outside**: Equivalent to cancel
- **Escape key**: Equivalent to cancel

## Cron Description Generator

**Purpose:** Convert technical cron expressions into human-readable descriptions.

**Implementation:**
```typescript
const describeCronExpression = (cron: string): string => {
  // Parse cron parts
  const [minute, hour, dayOfMonth, month, dayOfWeek] = cron.split(/\s+/);

  // Common patterns
  if (cron === '0 9 * * MON') return 'Every Monday at 9:00 AM';
  if (cron === '0 9 * * *') return 'Every day at 9:00 AM';
  if (cron === '0 */6 * * *') return 'Every 6 hours';
  // ... more patterns

  // Generic description
  let desc = 'Runs ';
  if (minute === '0' && hour !== '*') desc += `at ${hour}:00 `;
  if (minute.startsWith('*/')) desc += `every ${minute.slice(2)} minutes `;
  // ... more generic logic

  return desc.trim() || cron; // Fallback to raw cron
};
```

**Supported Patterns:**
- `0 9 * * *` → "Every day at 9:00 AM"
- `0 9 * * MON` → "Every Monday at 9:00 AM"
- `*/30 * * * *` → "Every 30 minutes"
- `0 */6 * * *` → "Every 6 hours"
- `0 0 * * *` → "Daily at midnight"
- `0 0 * * 0` → "Every Sunday at midnight"
- `0 0 1 * *` → "Monthly on the 1st at midnight"

**Future Enhancement:**
Consider using a library like [cronstrue](https://www.npmjs.com/package/cronstrue) for more comprehensive descriptions:
```typescript
import cronstrue from 'cronstrue';
const description = cronstrue.toString('0 9 * * MON');
// "At 09:00 AM, only on Monday"
```

## State Management

### Component State

```typescript
// Job data
const [jobs, setJobs] = useState<ScheduledJob[]>([]);
const [selectedJob, setSelectedJob] = useState<ScheduledJob | null>(null);
const [executions, setExecutions] = useState<JobExecution[]>([]);
const [stats, setStats] = useState<JobStats | null>(null);

// UI state
const [loading, setLoading] = useState(true);
const [executing, setExecuting] = useState<string | null>(null);
const [error, setError] = useState<string | null>(null);

// Modal state
const [editingCron, setEditingCron] = useState<{
  jobName: string;
  expression: string;
} | null>(null);
const [cronError, setCronError] = useState<string | null>(null);
const [savingCron, setSavingCron] = useState(false);

// Confirmation state
const [confirmation, setConfirmation] = useState<{
  action: string;
  jobName: string;
  onConfirm: () => void;
} | null>(null);
```

### State Transitions

**Enable/Disable Flow:**
```
User clicks toggle
  → Show confirmation dialog
  → User confirms
    → Call API (SchedulerAPI.enableJob / disableJob)
    → Success: Reload jobs, update cache
    → Error: Show error message
  → User cancels
    → Close dialog, no changes
```

**Edit Cron Flow:**
```
User clicks edit button
  → Open modal with current cron
  → User edits expression
    → Live preview updates
    → Validation runs on each change
  → User clicks save
    → Call API (SchedulerAPI.updateJobCron)
    → Success: Close modal, reload jobs
    → Error: Show error in modal
  → User clicks cancel
    → Close modal, no changes
```

**Manual Trigger Flow:**
```
User clicks trigger button
  → Set executing state
  → Call API (SchedulerAPI.triggerJob)
  → Show loading spinner
  → Success:
    → Reload jobs
    → Reload execution history
    → Show success message
  → Error:
    → Show error message
  → Clear executing state
```

## API Integration

### Jobs List
```typescript
const jobs = await SchedulerAPI.getScheduledJobs(token);
// Returns: ScheduledJob[]
```

### Job Details
```typescript
const job = await SchedulerAPI.getScheduledJob('job-name', token);
// Returns: ScheduledJob
```

### Enable/Disable
```typescript
await SchedulerAPI.enableJob('job-name', token);
await SchedulerAPI.disableJob('job-name', token);
// Returns: { message: string }
```

### Update Cron
```typescript
await SchedulerAPI.updateJobCron('job-name', '0 10 * * TUE', token);
// Returns: { message: string, cronExpression: string }
```

### Manual Trigger
```typescript
await SchedulerAPI.triggerJob('job-name', userId, token);
// Returns: { message: string, result: JobResult }
```

### Execution History
```typescript
const history = await SchedulerAPI.getJobHistory('job-name', token, 10, 0);
// Returns: { executions: JobExecution[], pagination: {...} }
```

### Statistics
```typescript
const stats = await SchedulerAPI.getJobStats('job-name', token, 30);
// Returns: { stats: JobStats, period: {...} }
```

## Error Handling

### API Errors

**Client-side handling:**
```typescript
try {
  await SchedulerAPI.updateJobCron(jobName, expression, token);
} catch (err: any) {
  if (err instanceof ApiError) {
    if (err.status === 400) {
      setCronError('Invalid cron expression format');
    } else if (err.status === 403) {
      setCronError('You do not have permission to edit schedules');
    } else {
      setCronError(err.message || 'Failed to update schedule');
    }
  } else {
    setCronError('Network error - please try again');
  }
}
```

**User-facing messages:**
- **400 Bad Request**: "Invalid cron expression format"
- **403 Forbidden**: "You do not have permission to perform this action"
- **404 Not Found**: "Job not found"
- **500 Server Error**: "Server error - please contact support"
- **Network Error**: "Network error - please check your connection"

### Validation Errors

**Cron expression validation:**
```typescript
// Client-side (basic)
if (!expression.match(/^[\d\*\/\-\,]+\s+[\d\*\/\-\,]+\s+[\d\*\/\-\,]+\s+[\d\*\/\-\,]+\s+[\d\*\/\-\,A-Z]+$/)) {
  setCronError('Invalid cron format - use: minute hour day month weekday');
  return;
}

// Server-side (comprehensive)
// Backend validates using node-cron.validate()
// Returns specific error messages for invalid patterns
```

**Toggle validation:**
```typescript
// Ensure job exists before toggling
const job = jobs.find(j => j.name === jobName);
if (!job) {
  alert('Job not found');
  return;
}
```

## Accessibility

### Keyboard Navigation
- **Tab**: Navigate between job cards and buttons
- **Enter/Space**: Activate buttons and toggles
- **Escape**: Close modals and dialogs
- **Arrow keys**: Navigate within modal forms

### Screen Readers
- **ARIA labels**: All interactive elements labeled
- **Status announcements**: State changes announced
- **Error messages**: Associated with form fields
- **Loading states**: Announced to screen readers

### Focus Management
- **Visible focus**: Clear focus indicators on all elements
- **Focus trap**: Modals trap focus until closed
- **Focus return**: Focus returns to trigger after modal closes
- **Skip links**: Allow skipping repetitive content

## Performance

### Optimization Strategies

**Data fetching:**
- Load jobs list once on mount
- Load job details only when selected
- Cache execution history and stats
- Debounce cron preview updates

**Rendering:**
- Use React.memo for job cards
- Virtualize long execution history lists
- Lazy load modals and dialogs
- Optimize re-renders with proper keys

**Network:**
- Batch API calls where possible
- Use optimistic UI updates
- Implement request caching
- Add loading states everywhere

## Testing Checklist

### Manual Testing

**Cron Editor:**
- [ ] Opens when clicking edit button
- [ ] Shows current cron expression
- [ ] Updates preview on change
- [ ] Validates invalid expressions
- [ ] Saves successfully
- [ ] Closes after save
- [ ] Cancels without saving

**Enable/Disable:**
- [ ] Shows confirmation dialog
- [ ] Updates job status on confirm
- [ ] Cancels without changing
- [ ] Updates visual appearance
- [ ] Persists across page reload

**Manual Trigger:**
- [ ] Shows loading state
- [ ] Executes job successfully
- [ ] Updates execution history
- [ ] Shows success message
- [ ] Handles errors gracefully

**Visual Feedback:**
- [ ] Disabled jobs appear faded
- [ ] Next run time updates
- [ ] Success rate calculates correctly
- [ ] Last run status shows
- [ ] Loading spinners appear

### Automated Testing

**Unit Tests:**
```typescript
describe('describeCronExpression', () => {
  it('describes daily schedule', () => {
    expect(describeCronExpression('0 9 * * *')).toBe('Every day at 9:00 AM');
  });

  it('describes weekly schedule', () => {
    expect(describeCronExpression('0 9 * * MON')).toBe('Every Monday at 9:00 AM');
  });

  it('describes interval schedule', () => {
    expect(describeCronExpression('*/30 * * * *')).toBe('Every 30 minutes');
  });
});
```

**Integration Tests:**
```typescript
describe('Scheduler Page', () => {
  it('loads jobs on mount', async () => {
    render(<SchedulerPage />);
    await waitFor(() => {
      expect(screen.getByText('Weekly Trending Digest')).toBeInTheDocument();
    });
  });

  it('opens cron editor on edit click', async () => {
    render(<SchedulerPage />);
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    await waitFor(() => {
      expect(screen.getByText('Edit Schedule')).toBeInTheDocument();
    });
  });
});
```

## Future Improvements

### Potential Enhancements

**Cron Editor:**
- [ ] Visual cron builder (dropdown selectors for parts)
- [ ] Cron expression history (undo/redo)
- [ ] Schedule conflict detection
- [ ] Time zone selector
- [ ] Next 5 run times preview

**Job Management:**
- [ ] Bulk operations (enable/disable multiple)
- [ ] Job groups/categories
- [ ] Search and filter jobs
- [ ] Export execution history
- [ ] Email notifications on failures

**Monitoring:**
- [ ] Real-time job status updates (WebSocket)
- [ ] Performance metrics charts
- [ ] Alert rules (email on N consecutive failures)
- [ ] SLA tracking and reporting
- [ ] Integration with monitoring tools (Datadog, New Relic)

**User Experience:**
- [ ] Dark mode support
- [ ] Customizable dashboard layout
- [ ] Saved views/filters
- [ ] Mobile-responsive design improvements
- [ ] Keyboard shortcuts reference

## Conclusion

The scheduler UI enhancements provide administrators with the operational controls they need while maintaining the safety and structure of code-based job definitions. The hybrid approach ensures:

- ✅ **Developers maintain control** over job logic and implementation
- ✅ **Admins have flexibility** to tune schedules and respond to incidents
- ✅ **Users get reliability** through proper validation and error handling
- ✅ **System stays auditable** with full execution history

These enhancements make the scheduler service production-ready while keeping the system safe, maintainable, and observable.
