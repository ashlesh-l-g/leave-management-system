package com.ashlesh.leavemanagement.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.UniqueConstraint;

/**
 * How many days of each leave type a user has.
 * Maps to the "leave_balances" table.
 *
 * One row per user *per leave type* (enforced by the unique constraint).
 */
@Entity
@Table(name = "leave_balances",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "leave_type"}))
public class LeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Many balances belong to one user -> foreign key column "user_id". */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "leave_type", nullable = false)
    private LeaveType leaveType;

    @Column(nullable = false)
    private int totalDays;

    @Column(nullable = false)
    private int usedDays;

    protected LeaveBalance() {
        // required by JPA
    }

    public LeaveBalance(User user, LeaveType leaveType, int totalDays, int usedDays) {
        this.user = user;
        this.leaveType = leaveType;
        this.totalDays = totalDays;
        this.usedDays = usedDays;
    }

    /** Not a database column - just calculated for the response. */
    @Transient
    public int getRemainingDays() {
        return totalDays - usedDays;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public LeaveType getLeaveType() {
        return leaveType;
    }

    public int getTotalDays() {
        return totalDays;
    }

    public void setTotalDays(int totalDays) {
        this.totalDays = totalDays;
    }

    public int getUsedDays() {
        return usedDays;
    }

    public void setUsedDays(int usedDays) {
        this.usedDays = usedDays;
    }
}
