import { Box, Text } from '@chakra-ui/react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

// Custom plugin to change point label color on hover
const hoverLabelPlugin = {
  id: 'hoverLabelPlugin',
  afterDraw: (chart) => {
    const { ctx, scales } = chart;
    const activeElements = chart.getActiveElements();

    // Check if scales and r exist before proceeding
    if (!scales || !scales.r) return;

    const { r } = scales;

    activeElements.forEach((active) => {
      const index = active.index;
      // Ensure r.max is defined before calling getPointPositionForValue
      if (typeof r.max === 'undefined') return;

      const labelPoint = r.getPointPositionForValue(index, r.max);
      ctx.save();
      ctx.fillStyle = '#000'; // Set label text to black on hover
      ctx.font = '14px "Matt Bold"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(chart.data.labels[index], labelPoint.x, labelPoint.y);
      ctx.restore();
    });
  }
};

// Register Chart.js components and the custom plugin
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  hoverLabelPlugin
);

function InfluencerFeatureSpiderChartChartJS({ influencerData }) {
  // Early return if no data is available
  if (!influencerData || influencerData.timesRanked === 0) {
    return (
      <Text fontSize="lg" color="gray.500" fontFamily="Matt Light">
        No ratings yet
      </Text>
    );
  }

  // Define feature ratings data
  const featureRatings = [
    { name: 'Eyes', value: (influencerData.eyesRating || 0) / influencerData.timesRanked },
    { name: 'Smile', value: (influencerData.smileRating || 0) / influencerData.timesRanked },
    { name: 'Jawline', value: (influencerData.facialRating || 0) / influencerData.timesRanked },
    { name: 'Hair', value: (influencerData.hairRating || 0) / influencerData.timesRanked },
    { name: 'Body', value: (influencerData.bodyRating || 0) / influencerData.timesRanked },
  ];

  // Chart data configuration
  const chartData = {
    labels: featureRatings.map(feature => feature.name),
    datasets: [
      {
        label: 'Feature Ratings',
        data: featureRatings.map(feature => feature.value),
        backgroundColor: 'rgba(56, 178, 172, 0.2)', // Teal with transparency
        borderColor: 'rgba(56, 178, 172, 1)', // Solid teal
        borderWidth: 2,
        pointBackgroundColor: 'rgba(56, 178, 172, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(56, 178, 172, 1)',
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };

  // Chart options for better readability and styling
  const chartOptions = {
    scales: {
      r: {
        angleLines: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)', // Subtle gray lines
        },
        ticks: {
          display: true,
          stepSize: 0.5, // Smaller steps for precision
          font: {
            family: 'Matt Light',
            size: 12,
          },
          color: 'gray.600',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)', // Light grid lines
        },
        pointLabels: {
          font: {
            family: 'Matt Bold',
            size: 14,
          },
          color: 'gray.800', // Default label color when not hovered
        },
        min: 0,
        max: 2.5, // Adjusted max value
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            family: 'Matt Bold',
            size: 12,
          },
          color: 'gray.800',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleFont: { family: 'Matt Bold' },
        bodyFont: { family: 'Matt Light' },
        titleColor: 'gray.800',
        bodyColor: '#000000',
        borderColor: 'gray.200',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || '';
            const value = context.parsed.r.toFixed(1); // Radial value
            return `${label}: ${value}`;
          },
        },
      },
    },
  };

  return (
    <Box
      p={4}
      shadow="md"
      borderWidth="1px"
      bg="gray.50"
      borderRadius="md"
      maxW="400px"
      mx="auto"
    >
      <Text
        fontSize="lg"
        fontWeight="bold"
        mb={4}
        color="gray.800"
        fontFamily="Matt Bold"
        textAlign="center"
      >
        Feature Ratings
      </Text>
      <Box h="300px">
        <Radar data={chartData} options={chartOptions} />
      </Box>
    </Box>
  );
}

export default InfluencerFeatureSpiderChartChartJS;