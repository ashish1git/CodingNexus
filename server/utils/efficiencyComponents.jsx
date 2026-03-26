/**
 * Frontend Efficiency Rating Components
 * React components for displaying time/space complexity efficiency ratings
 * 
 * Usage:
 * import { EfficiencyCard, EfficiencyBadge, EfficiencyComparison } from '@/components/efficiency';
 */

import { getComplexityColor, formatExecutionTime, formatMemory } from '@/utils/complexityDisplay';

/**
 * ⭐ EfficiencyBadge - Simple badge showing efficiency score
 */
export function EfficiencyBadge({ score, rating }) {
  const getColor = (rating) => {
    switch (rating) {
      case 'optimal':
        return '#10b981';      // Green
      case 'excellent':
        return '#06b6d4';      // Cyan
      case 'suboptimal':
        return '#f59e0b';      // Amber
      default:
        return '#6b7280';      // Gray
    }
  };

  const getLabel = (rating) => {
    switch (rating) {
      case 'optimal':
        return '✅ Perfect';
      case 'excellent':
        return '🚀 Excellent';
      case 'suboptimal':
        return '⚠️ Needs Work';
      case 'unknown':
        return '❓ Unknown';
      default:
        return rating;
    }
  };

  const color = getColor(rating);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: color + '20',
        color: color,
        borderRadius: '6px',
        border: `2px solid ${color}`,
        fontWeight: 'bold'
      }}
    >
      <span style={{ fontSize: '18px' }}>{score}/100</span>
      <span>{getLabel(rating)}</span>
    </div>
  );
}

/**
 * ⭐ EfficiencyComparison - Show actual vs expected complexity
 */
export function EfficiencyComparison({ efficiency }) {
  if (!efficiency.timeComplexity) {
    return <div>No efficiency data available</div>;
  }

  const actualColor = getComplexityColor(efficiency.timeComplexity.actual);
  const expectedColor = getComplexityColor(efficiency.timeComplexity.expected);
  const comparisonEmoji = {
    better: '🔼',
    equal: '✅',
    worse: '🔽',
    unknown: '❓'
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: '16px',
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        alignItems: 'center'
      }}
    >
      {/* Actual Complexity */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Your Solution</p>
        <div
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: actualColor,
            padding: '12px',
            backgroundColor: actualColor + '20',
            borderRadius: '6px'
          }}
        >
          {efficiency.timeComplexity.actual}
        </div>
        {efficiency.timeComplexity.confidence && (
          <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
            {efficiency.timeComplexity.confidence}% confident
          </p>
        )}
      </div>

      {/* Comparison Arrow */}
      <div style={{ fontSize: '28px', textAlign: 'center' }}>
        {comparisonEmoji[efficiency.timeComplexity.comparison] || '→'}
      </div>

      {/* Expected Complexity */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Expected (Optimal)</p>
        <div
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: expectedColor,
            padding: '12px',
            backgroundColor: expectedColor + '20',
            borderRadius: '6px'
          }}
        >
          {efficiency.timeComplexity.expected}
        </div>
      </div>
    </div>
  );
}

/**
 * ⭐ EfficiencyCard - Complete efficiency information card
 */
export function EfficiencyCard({ submission, canExpand = true }) {
  const [expanded, setExpanded] = React.useState(false);

  if (!submission.efficiency || !submission.efficiency.overall) {
    return (
      <div style={{ padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
        <p>No efficiency data available for this submission.</p>
        {!submission.efficiency.expectedComplexity && (
          <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
            The problem doesn't have an expected complexity specified.
          </p>
        )}
      </div>
    );
  }

  const eff = submission.efficiency;

  return (
    <div style={{ borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#f9fafb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: canExpand ? 'pointer' : 'default'
        }}
        onClick={() => canExpand && setExpanded(!expanded)}
      >
        <div>
          <h3 style={{ margin: 0, marginBottom: '8px' }}>Efficiency Rating</h3>
          <EfficiencyBadge score={eff.overall.score} rating={eff.overall.overall} />
        </div>
        {canExpand && (
          <span style={{ fontSize: '20px' }}>
            {expanded ? '▼' : '▶'}
          </span>
        )}
      </div>

      {/* Expanded Content */}
      {(expanded || !canExpand) && (
        <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
          {/* Complexity Comparison */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Time Complexity</h4>
            <EfficiencyComparison efficiency={eff} />
          </div>

          {/* Space Complexity */}
          {eff.spaceComplexity && eff.spaceComplexity.expected && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Space Complexity</h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '6px'
                  }}
                >
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>Actual</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#1e40af' }}>
                    {eff.spaceComplexity.actual}
                  </p>
                </div>
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '6px'
                  }}
                >
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>Expected</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#92400e' }}>
                    {eff.spaceComplexity.expected}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Execution Metrics */}
          {eff.executionMetrics && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Execution Metrics</h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '6px'
                  }}
                >
                  <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#666' }}>Max Time</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                    {formatExecutionTime(eff.executionMetrics.maxTime)}
                  </p>
                </div>
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '6px'
                  }}
                >
                  <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#666' }}>Avg Time</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                    {formatExecutionTime(eff.executionMetrics.avgTime)}
                  </p>
                </div>
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '6px'
                  }}
                >
                  <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#666' }}>Max Memory</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                    {formatMemory(eff.executionMetrics.maxMemory)}
                  </p>
                </div>
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '6px'
                  }}
                >
                  <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#666' }}>Avg Memory</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                    {formatMemory(eff.executionMetrics.avgMemory)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {eff.suggestions && eff.suggestions.length > 0 && (
            <div style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: '6px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>💡 Suggestions</h4>
              {eff.suggestions.map((suggestion, idx) => (
                <p
                  key={idx}
                  style={{
                    margin: idx === 0 ? 0 : '4px 0 0 0',
                    fontSize: '13px',
                    color: '#78350f'
                  }}
                >
                  {suggestion}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ⭐ EfficiencyLeaderboard - Show student efficiency ranking
 */
export function EfficiencyLeaderboard({ report }) {
  if (!report || !report.studentReports) {
    return <div>No efficiency data available</div>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>Rank</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Student</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Avg Efficiency</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Perfect</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Suboptimal</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Evaluated</th>
          </tr>
        </thead>
        <tbody>
          {report.studentReports.map((student, idx) => (
            <tr
              key={student.userId}
              style={{
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb'
              }}
            >
              <td style={{ padding: '12px' }}>
                <strong>#{idx + 1}</strong>
              </td>
              <td style={{ padding: '12px' }}>
                <strong>{student.userName}</strong>
                <br />
                <span style={{ fontSize: '12px', color: '#666' }}>{student.email}</span>
              </td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                {student.avgEfficiencyScore !== null ? (
                  <span
                    style={{
                      display: 'inline-block',
                      backgroundColor:
                        student.avgEfficiencyScore >= 90
                          ? '#d1fae5'
                          : student.avgEfficiencyScore >= 70
                          ? '#fef3c7'
                          : '#fee2e2',
                      color:
                        student.avgEfficiencyScore >= 90
                          ? '#065f46'
                          : student.avgEfficiencyScore >= 70
                          ? '#92400e'
                          : '#991b1b',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}
                  >
                    {student.avgEfficiencyScore}/100
                  </span>
                ) : (
                  <span style={{ color: '#999' }}>N/A</span>
                )}
              </td>
              <td style={{ padding: '12px', textAlign: 'center', color: '#059669' }}>
                <strong>{student.perfectSolutions}</strong>
              </td>
              <td style={{ padding: '12px', textAlign: 'center', color: '#dc2626' }}>
                <strong>{student.suboptimalSolutions}</strong>
              </td>
              <td
                style={{
                  padding: '12px',
                  textAlign: 'center',
                  color: '#666'
                }}
              >
                {student.evaluatedProblems}/{student.totalProblems}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Competition Statistics */}
      {report.statistics && (
        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '16px'
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Participants</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>
              {report.statistics.totalParticipants}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Avg Efficiency</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: '#059669' }}>
              {report.statistics.avgCompetitionEfficiency}/100
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Ideal Solutions</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>
              {report.statistics.idealSolutions}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default {
  EfficiencyBadge,
  EfficiencyComparison,
  EfficiencyCard,
  EfficiencyLeaderboard
};
