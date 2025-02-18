import React from "react";

const StatsCard = ({ title, value, icon: Icon }) => {
  return (
    <div className="bg-gray-900 p-6 rounded-xl shadow-lg border-4 border-yellow-400 text-center transform transition-all hover:scale-105 hover:shadow-xl">
      {Icon && <Icon className="text-yellow-400 text-4xl mb-2 mx-auto" />}
      <h3 className="text-2xl font-bold text-yellow-400">{title}</h3>
      <p className="text-4xl font-semibold text-white mt-2">{value}</p>
    </div>
  );
};

export default StatsCard;
