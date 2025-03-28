import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Heading } from '@chakra-ui/react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FeatureRatingComparison = ({ chartData, entityName, isMobile }) => {
  const data = {
    labels: chartData.map(item => item.feature),
    datasets: [
      {
        label: 'Your Average',
        data: chartData.map(item => item.user.toFixed(1)),
        backgroundColor: 'rgba(136, 132, 216, 0.6)',
      },
      {
        label: `${entityName}'s Average`,
        data: chartData.map(item => item.entity.toFixed(1)),
        backgroundColor: 'rgba(130, 202, 157, 0.6)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      tooltip: {
        enabled: true,
      },
      legend: {
        position: 'top',
      },
    },
  };

  return (
    <>
      <Heading as="h3" size="md" mb={4}>
        {entityName} Comparison
      </Heading>
      <div style={{ height: isMobile ? '250px' : '300px', width: '100%' }}>
        <Bar data={data} options={options} />
      </div>
    </>
  );
};

export default FeatureRatingComparison;